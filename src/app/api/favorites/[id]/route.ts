import type { NextRequest } from 'next/server';
import { handle, readJson, type ItemParams } from '@/server/http';
import { setFavorite } from '@/server/service';
import { favoriteSchema, objectId } from '@/server/validation';

export function PUT(request: NextRequest, { params }: ItemParams) {
  return handle(request, async (visitor) => {
    const { saved } = favoriteSchema.parse(await readJson(request));
    await setFavorite(visitor, objectId.parse((await params).id), saved);
    return { saved };
  }, { private: true });
}
