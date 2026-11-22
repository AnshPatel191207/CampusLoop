import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, ChevronLeft, MapPin, MessageCircle, UserRound } from 'lucide-react';
import { EmptyState, ListingGrid } from '@/components/listing-card';
import { formatDate } from '@/lib/catalog';
import { sellerDetails } from '@/server/service';
import { objectId } from '@/server/validation';
import type { ItemParams } from '@/server/http';

export const metadata: Metadata = { title: 'Seller profile' };

export default async function SellerPage({ params }: ItemParams) {
  const id = objectId.safeParse((await params).id);
  if (!id.success) notFound();
  const result = await sellerDetails(id.data);
  if (!result) notFound();
  const { seller, current, history } = result;

  return <main className="shell inner-page">
    <Link className="back-link" href="/#market"><ChevronLeft size={17} /> Marketplace</Link>
    <section className="panel seller-profile">
      <span className="seller-avatar large"><UserRound size={33} /></span>
      <div><h1>{seller.name}</h1>
        <div className="detail-meta"><span><MapPin size={17} />{seller.campus}</span><span><CalendarDays size={17} />Joined {formatDate(seller.createdAt)}</span></div>
        {seller.bio && <p>{seller.bio}</p>}
        <p className="seller-contact"><MessageCircle size={17} /><strong>Prefers</strong> {seller.contact}</p>
      </div>
    </section>
    <section className="sub-section"><div className="section-heading"><h2>Active listings</h2><span>{current.length}</span></div>
      {current.length ? <ListingGrid items={current} /> : <EmptyState title="No active listings">This seller has nothing listed right now.</EmptyState>}
    </section>
    <section className="sub-section"><div className="section-heading"><h2>Listing history</h2><span>{history.length} sold</span></div>
      {history.length ? <ListingGrid items={history} /> : <p className="muted">No sold listings yet.</p>}
    </section>
  </main>;
}
