import { NextResponse, type NextRequest } from 'next/server';
import { handle, type PhotoParams } from '@/server/http';
import { getPhoto, RequestError } from '@/server/service';
import { objectId } from '@/server/validation';

export function GET(request: NextRequest, { params }: PhotoParams) {
  return handle(request, async (_, visitor) => {
    const { id, photo } = await params;
    const image = await getPhoto(objectId.parse(id), objectId.parse(photo), visitor);
    if (!image) throw new RequestError('Photo not found.', 404);
    return new NextResponse(new Uint8Array(image.data), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  });
}
