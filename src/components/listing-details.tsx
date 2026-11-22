'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { MAX_PRICE, type Listing } from '@/lib/catalog';
import { api, errorText, json, useActivity } from './activity-provider';
import { ListingImage } from './listing-card';

export function ListingGallery({ listing }: { listing: Listing }) {
  const [photo, setPhoto] = useState(0);
  return <div className="gallery">
    <div className="gallery-main"><ListingImage src={listing.photos[photo]} alt={listing.name + ' photo ' + (photo + 1)} eager /></div>
    {listing.photos.length > 1 && <div className="gallery-thumbnails">{listing.photos.map((src, i) =>
      <button className="gallery-thumbnail" key={src} aria-label={'View photo ' + (i + 1)} aria-pressed={photo === i} onClick={() => setPhoto(i)}>
        <ListingImage src={src} alt="" />
      </button>,
    )}</div>}
  </div>;
}

export function EnquiryForm({ listing }: { listing: Listing }) {
  const { activity, error: activityError, refresh } = useActivity();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = form.get('amount');
    setError('');
    setBusy(true);
    try {
      await api('/listings/' + listing.id + '/enquiries', json('POST', {
        buyerName: form.get('buyerName'), message: form.get('message'), amount: amount ? Number(amount) : null,
      }));
      setSent(true);
      await refresh();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  if (sent) return <div className="notice success" role="status">Enquiry sent. <Link href="/dashboard?tab=sent">Track it in your dashboard.</Link></div>;
  if (!open) return <button className="button primary" onClick={() => setOpen(true)}><MessageCircle size={18} />Contact seller</button>;
  return <form className="enquiry-form" onSubmit={send}>
    <label>Your name<input name="buyerName" autoComplete="name" required minLength={2} maxLength={70} defaultValue={activity?.profile?.name} /></label>
    <label>Message<textarea name="message" autoFocus rows={3} required minLength={5} maxLength={1600} placeholder="Ask a question or suggest a campus meetup." /></label>
    {listing.type === 'For Sale' && <label>Offer price (₹) <span className="optional">(optional)</span><input name="amount" type="number" min="0.01" max={MAX_PRICE} step="0.01" placeholder="0.00" /></label>}
    {!activity && activityError && <p className="notice error" role="alert">{activityError} <button type="button" className="text-button" onClick={() => void refresh()}>Retry</button></p>}
    {error && <p className="notice error" role="alert">{error}</p>}
    <div className="inline-actions"><button className="button primary" type="submit" disabled={busy || !activity}>{busy ? 'Sending…' : 'Send enquiry'}</button><button className="button secondary" type="button" onClick={() => setOpen(false)}>Cancel</button></div>
  </form>;
}
