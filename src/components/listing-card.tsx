'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ImageOff, MapPin, PackageOpen } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { listingPrice, listingStatus, type Listing } from '@/lib/catalog';
import { errorText, useActivity } from './activity-provider';

export function ListingImage({ src, alt, eager = false }: { src?: string; alt: string; eager?: boolean }) {
  const [failed, setFailed] = useState('');
  return src && failed !== src
    ? <Image className="cover-image" src={src} alt={alt} fill loading={eager ? 'eager' : 'lazy'} unoptimized onError={() => setFailed(src)} />
    : <span className="photo-fallback"><ImageOff size={27} /><span>Photo unavailable</span></span>;
}

export function FavoriteButton({ listing, detail = false }: { listing: Listing; detail?: boolean }) {
  const { activity, toggleFavorite } = useActivity();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saved = activity?.favorites.some((item) => item.id === listing.id) ?? false;
  const available = listing.active && listing.status === 'Available' && !listing.deleted;
  if (!saved && !available) return null;
  return <div className={detail ? 'detail-save' : 'card-save'}>
    <button type="button" className={(detail ? 'button secondary' : 'heart-button') + (saved ? ' is-saved' : '')}
      disabled={busy} aria-pressed={saved} aria-label={saved ? 'Remove from saved' : 'Save ' + listing.name}
      onClick={async () => {
        setBusy(true);
        setError('');
        try { await toggleFavorite(listing.id, !saved); }
        catch (error) { setError(errorText(error)); }
        finally { setBusy(false); }
      }}>
      <Heart size={18} fill={saved ? 'currentColor' : 'none'} />{detail && (saved ? 'Saved' : 'Save')}
    </button>
    {error && <span className="favorite-error" role="alert">{error}</span>}
  </div>;
}

export function ListingCard({ listing }: { listing: Listing }) {
  const status = listingStatus(listing);
  const content = <>
    <div className="card-photo">
      <ListingImage src={listing.photos[0]} alt={listing.name} />
      <span className={'photo-label' + (status === 'Available' ? '' : ' unavailable')}>{status === 'Available' ? listing.condition : status}</span>
    </div>
    <div className="card-content">
      <span className="card-category">{listing.category}</span>
      <h3>{listing.name}</h3>
      <strong>{listingPrice(listing)}</strong>
      <span className="card-campus"><MapPin size={14} />{listing.campus}</span>
    </div>
  </>;
  return <article className="listing-card">
    {listing.active && !listing.deleted ? <Link className="card-link" href={'/listing/' + listing.id}>{content}</Link> : <div className="card-link">{content}</div>}
    <FavoriteButton listing={listing} />
  </article>;
}

export function ListingGrid({ items }: { items: Listing[] }) {
  return <div className="listing-grid">{items.map((listing) => <ListingCard listing={listing} key={listing.id} />)}</div>;
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><PackageOpen size={25} /></span><h3>{title}</h3><p>{children}</p>{action}</div>;
}
