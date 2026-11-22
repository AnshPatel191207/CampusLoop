import type { NextRequest } from 'next/server';
import { handle, readJson } from '@/server/http';
import { saveSeller } from '@/server/service';
import { sellerSchema } from '@/server/validation';

export function PUT(request: NextRequest) {
  return handle(request, async (visitor) => saveSeller(visitor, sellerSchema.parse(await readJson(request))), { private: true });
}
