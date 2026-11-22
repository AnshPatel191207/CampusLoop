import type { Metadata } from 'next';
import { ListingForm } from '@/components/listing-form';

export const metadata: Metadata = { title: 'List an item' };

export default function SellPage() {
  return <main className="shell inner-page narrow">
    <div className="page-heading"><h1>List an item</h1><p>Pass on something useful to another student.</p></div>
    <ListingForm />
  </main>;
}
