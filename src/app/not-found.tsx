import Link from 'next/link';
import { EmptyState } from '@/components/listing-card';

export default function NotFound() {
  return <main className="shell inner-page narrow"><EmptyState title="We couldn’t find that page" action={<Link className="button primary" href="/#market">Back to marketplace</Link>}>
    The listing or page may have been removed.
  </EmptyState></main>;
}
