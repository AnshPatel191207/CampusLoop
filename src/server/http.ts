import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { MAX_PHOTO_BYTES, MAX_PHOTOS } from '@/lib/catalog';
import { preparePhotos, RequestError } from './service';
import { listingSchema } from './validation';

export const VISITOR_COOKIE = 'campus_loop_device';
const cookiePattern = /^[a-f0-9]{48}$/;

export function visitorId(value?: string) {
  return value && cookiePattern.test(value) ? value : undefined;
}

export type ItemParams = { params: Promise<{ id: string }> };
export type PhotoParams = { params: Promise<{ id: string; photo: string }> };

export async function handle(
  request: NextRequest, operation: (visitor: string, existing?: string) => Promise<unknown>,
  options: { private?: boolean; status?: number } = {},
) {
  const existing = visitorId(request.cookies.get(VISITOR_COOKIE)?.value);
  const visitor = existing ?? randomBytes(24).toString('hex');
  try {
    const source = request.headers.get('sec-fetch-site');
    if (request.method !== 'GET' && (source === 'cross-site' || source === 'same-site')) {
      throw new RequestError('Open the marketplace to make changes.', 403);
    }
    const result = await operation(visitor, existing);
    const response = result instanceof NextResponse ? result : NextResponse.json(result, {
      status: options.status ?? 200,
      headers: { 'Cache-Control': 'no-store' },
    });
    if (options.private && !existing) response.cookies.set(VISITOR_COOKIE, visitor, {
      httpOnly: true, secure: request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https',
      sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    let message = 'The marketplace is temporarily unavailable. Please try again.';
    let status = 503;
    if (error instanceof RequestError) {
      message = error.message;
      status = error.status;
    } else if (error instanceof ZodError) {
      const issue = error.issues[0];
      message = issue.path.length ? issue.path.join('.') + ' — ' + issue.message : issue.message;
      status = 400;
    } else if (error instanceof SyntaxError) {
      message = 'The submitted data could not be read.';
      status = 400;
    } else {
      // Driver errors can include connection details, so log only the error class.
      console.error('Marketplace request failed', error instanceof Error ? error.name : 'Unknown error');
    }
    return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function readJson(request: NextRequest) {
  return JSON.parse(new TextDecoder().decode(await limitedBody(request, 12_000)));
}

async function limitedBody(request: NextRequest, limit: number) {
  if (Number(request.headers.get('content-length') ?? 0) > limit) throw new RequestError('The submission is too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return Buffer.concat(chunks, bytes);
      bytes += value.byteLength;
      if (bytes > limit) {
        await reader.cancel();
        throw new RequestError('The submission is too large.', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}

export async function listingBody(request: NextRequest, id?: string) {
  const contentType = request.headers.get('content-type');
  if (!contentType?.startsWith('multipart/form-data;')) throw new RequestError('Submit the listing and photos as form data.', 415);
  const raw = await limitedBody(request, MAX_PHOTO_BYTES * MAX_PHOTOS + 32_000);
  let form;
  try {
    form = await new Response(new Uint8Array(raw), { headers: { 'Content-Type': contentType } }).formData();
  } catch {
    throw new RequestError('The submitted listing could not be read.');
  }
  const json = form.get('listing');
  if (typeof json !== 'string') throw new RequestError('Listing details are required.');
  const data = listingSchema.parse(JSON.parse(json));
  const prefix = '/api/listings/' + id + '/photos/';
  data.keepPhotos = data.keepPhotos.map((path) => (id && path.startsWith(prefix)) ? path.slice(prefix.length) : path);
  const files = form.getAll('photos');
  if (files.some((file) => typeof file === 'string')) throw new RequestError('Choose image files to upload.');
  return { data, photos: await preparePhotos(files as File[]) };
}
