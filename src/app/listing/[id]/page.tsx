import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, PencilLine, UserRound } from 'lucide-react';
import { FavoriteButton, ListingGrid } from '@/components/listing-card';
import { EnquiryForm, ListingGallery } from '@/components/listing-details';
import { formatDate, listingPrice, listingStatus } from '@/lib/catalog';
import { currentVisitor } from '@/server/current-visitor';
import { listingDetails } from '@/server/service';
import { objectId } from '@/server/validation';
import type { ItemParams } from '@/server/http';

export const metadata: Metadata = { title: 'Listing details' };

export default async function ListingPage({ params }: ItemParams) {
  const id = objectId.safeParse((await params).id);
  if (!id.success) notFound();
  const result = await listingDetails(id.data, await currentVisitor());
  if (!result) notFound();
  const { listing, seller, similar, isOwner } = result;
  const status = listingStatus(listing);

  return <main className="shell inner-page">
    <Link className="back-link" href="/#market"><ChevronLeft size={17} /> Marketplace</Link>
    <div className="detail-layout">
      <ListingGallery listing={listing} />
      <div className="detail-content">
        <div className="pill-row"><span className="pill">{listing.category}</span><span className="pill">{listing.condition}</span><span className={'pill status-' + status.toLowerCase()}>{status}</span></div>
        <h1>{listing.name}</h1><div className="detail-price">{listingPrice(listing)}</div>
        <div className="detail-meta"><span><MapPin size={17} />{listing.campus}</span><span><CalendarDays size={17} />{formatDate(listing.createdAt)}</span></div>
        <section className="description"><h2>About this item</h2><p>{listing.description}</p></section>
        <Link className="seller-mini" href={'/seller/' + seller.id}>
          <span className="seller-avatar"><UserRound size={22} /></span><span><strong>{seller.name}</strong><span>{seller.contact}</span></span><ChevronRight size={18} />
        </Link>
        <div className="detail-actions">
          {isOwner ? <Link className="button primary" href={'/dashboard/edit/' + listing.id}><PencilLine size={17} />Edit listing</Link>
            : status === 'Available' ? <EnquiryForm listing={listing} /> : <p className="muted">This listing is {status.toLowerCase()}.</p>}
          <FavoriteButton detail listing={listing} />
        </div>
      </div>
    </div>
    {similar.length > 0 && <section className="sub-section">
      <div className="section-heading"><h2>Similar listings</h2><Link href={'/?category=' + listing.category + '#market'}>See all {listing.category.toLowerCase()}</Link></div>
      <ListingGrid items={similar} />
    </section>}
  </main>;
}
