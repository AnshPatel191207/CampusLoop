import type { NextRequest } from 'next/server';
import { handle, readJson, type ItemParams } from '@/server/http';
import { sendEnquiry } from '@/server/service';
import { enquirySchema, objectId } from '@/server/validation';

export function POST(request: NextRequest, { params }: ItemParams) {
  return handle(request, async (visitor) =>
    sendEnquiry(visitor, objectId.parse((await params).id), enquirySchema.parse(await readJson(request))),
  { private: true, status: 201 });
}
