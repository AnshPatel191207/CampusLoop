import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ListingForm } from '@/components/listing-form';
import { currentVisitor } from '@/server/current-visitor';
import { listingDetails } from '@/server/service';
import { objectId } from '@/server/validation';
import type { ItemParams } from '@/server/http';

export const metadata: Metadata = { title: 'Edit listing' };

export default async function EditPage({ params }: ItemParams) {
  const id = objectId.safeParse((await params).id);
  if (!id.success) notFound();
  const result = await listingDetails(id.data, await currentVisitor());
  if (!result?.isOwner) notFound();
  return <main className="shell inner-page narrow">
    <div className="page-heading"><h1>Edit listing</h1><p>Update your photos, price, or product details.</p></div>
    <ListingForm listing={result.listing} />
  </main>;
}
