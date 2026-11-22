import type { NextRequest } from 'next/server';
import { handle, readJson, type ItemParams } from '@/server/http';
import { respond } from '@/server/service';
import { objectId, responseSchema } from '@/server/validation';

export function PATCH(request: NextRequest, { params }: ItemParams) {
  return handle(request, async (visitor) =>
    respond(visitor, objectId.parse((await params).id), responseSchema.parse(await readJson(request))),
  { private: true });
}
