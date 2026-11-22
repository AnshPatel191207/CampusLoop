import type { NextRequest } from 'next/server';
import { handle, listingBody } from '@/server/http';
import { marketplace, saveListing } from '@/server/service';
import { searchSchema } from '@/server/validation';

export function GET(request: NextRequest) {
  return handle(request, () => marketplace(searchSchema.parse(Object.fromEntries(request.nextUrl.searchParams))));
}

export function POST(request: NextRequest) {
  return handle(request, async (visitor) => {
    const { data, photos } = await listingBody(request);
    return saveListing(visitor, data, photos);
  }, { private: true, status: 201 });
}
