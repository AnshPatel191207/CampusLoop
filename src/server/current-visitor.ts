import { cookies } from 'next/headers';
import { VISITOR_COOKIE, visitorId } from './http';

export async function currentVisitor() {
  return visitorId((await cookies()).get(VISITOR_COOKIE)?.value);
}
