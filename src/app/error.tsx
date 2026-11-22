'use client';

import { EmptyState } from '@/components/listing-card';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="shell inner-page narrow"><EmptyState title="This page couldn’t load" action={<button className="button primary" onClick={reset}>Try again</button>}>
    The marketplace is temporarily unavailable.
  </EmptyState></main>;
}
