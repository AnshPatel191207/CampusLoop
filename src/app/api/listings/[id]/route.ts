import type { NextRequest } from 'next/server';
import { handle, listingBody, readJson, type ItemParams } from '@/server/http';
import { changeListing, listingDetails, RequestError, saveListing } from '@/server/service';
import { listingStateSchema, objectId } from '@/server/validation';

export function GET(request: NextRequest, { params }: ItemParams) {
  return handle(request, async (_, existing) => {
    const details = await listingDetails(objectId.parse((await params).id), existing);
    if (!details) throw new RequestError('Listing not found.', 404);
    return details;
  });
}

export function PUT(request: NextRequest, { params }: ItemParams) {
  return handle(request, async (visitor) => {
    const id = objectId.parse((await params).id);
    const { data, photos } = await listingBody(request, id);
    return saveListing(visitor, data, photos, id);
  }, { private: true });
}

export function PATCH(request: NextRequest, { params }: ItemParams) {
  return handle(request, async (visitor) =>
    changeListing(visitor, objectId.parse((await params).id), listingStateSchema.parse(await readJson(request))),
  { private: true });
}

export function DELETE(request: NextRequest, { params }: ItemParams) {
  return handle(request, async (visitor) => changeListing(visitor, objectId.parse((await params).id), null), { private: true });
}
