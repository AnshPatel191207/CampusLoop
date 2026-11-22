'use client';

import Link from 'next/link';
import { useActivity } from './activity-provider';
import { EmptyState, ListingGrid } from './listing-card';

export function SavedListings() {
  const { activity, error, refresh } = useActivity();
  if (!activity) return error
    ? <div className="notice error" role="alert">{error} <button className="text-button" onClick={() => void refresh()}>Retry</button></div>
    : <p className="muted" role="status">Loading your saved listings…</p>;

  const available = activity.favorites.filter((item) => item.active && item.status === 'Available' && !item.deleted);
  const unavailable = activity.favorites.filter((item) => !available.includes(item));
  if (!activity.favorites.length) return <EmptyState title="Nothing saved yet" action={<Link className="button primary" href="/#market">Browse listings</Link>}>
    Tap the heart on a listing to save it here.
  </EmptyState>;
  return <>
    {available.length > 0 && <ListingGrid items={available} />}
    {unavailable.length > 0 && <section className="sub-section"><div className="section-heading"><h2>No longer available</h2></div><ListingGrid items={unavailable} /></section>}
  </>;
}
