import type { NextRequest } from 'next/server';
import { handle, type ItemParams } from '@/server/http';
import { RequestError, sellerDetails } from '@/server/service';
import { objectId } from '@/server/validation';

export function GET(request: NextRequest, { params }: ItemParams) {
  return handle(request, async () => {
    const result = await sellerDetails(objectId.parse((await params).id));
    if (!result) throw new RequestError('Seller not found.', 404);
    return result;
  });
}
