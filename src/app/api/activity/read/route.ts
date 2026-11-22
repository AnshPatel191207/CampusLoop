import type { NextRequest } from 'next/server';
import { handle } from '@/server/http';
import { markRead } from '@/server/service';

export function PATCH(request: NextRequest) {
  return handle(request, async (visitor) => {
    await markRead(visitor);
    return { ok: true };
  }, { private: true });
}
