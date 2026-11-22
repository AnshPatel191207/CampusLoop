import type { NextRequest } from 'next/server';
import { handle } from '@/server/http';
import { activity } from '@/server/service';

export function GET(request: NextRequest) {
  return handle(request, (visitor) => activity(visitor), { private: true });
}
