import type { Metadata } from 'next';
import { SavedListings } from '@/components/saved-listings';

export const metadata: Metadata = { title: 'Saved listings' };

export default function SavedPage() {
  return <main className="shell inner-page">
    <div className="page-heading"><h1>Saved listings</h1><p>Keep track of the items you want to come back to.</p></div>
    <SavedListings />
  </main>;
}
