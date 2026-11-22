'use client';

import Link from 'next/link';
import { Archive, Bell, Check, CircleDollarSign, Clock3, Eye, LayoutGrid, MessageCircle, PencilLine, Send, Trash2, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { formatDate, formatPrice, listingPrice, listingStatus, STATUSES, type Enquiry, type Listing, type Seller } from '@/lib/catalog';
import { api, errorText, json, useActivity } from './activity-provider';
import { EmptyState, ListingImage } from './listing-card';
import { ProfileFields, readProfile } from './profile-fields';

type Tab = 'listings' | 'received' | 'offers' | 'sent' | 'profile';
const tabs = [
  { id: 'listings', title: 'My listings', icon: LayoutGrid },
  { id: 'received', title: 'Received', icon: MessageCircle },
  { id: 'offers', title: 'Pending offers', icon: CircleDollarSign },
  { id: 'sent', title: 'Sent', icon: Send },
  { id: 'profile', title: 'Seller profile', icon: UserRound },
] as const;
const listingFilters = ['All', 'Available', 'Reserved', 'Sold', 'Inactive', 'Deleted'] as const;

export function Dashboard({ selected }: { selected: Tab }) {
  const { activity, error, refresh } = useActivity();
  const [readError, setReadError] = useState('');
  const [marking, setMarking] = useState(false);
  if (!activity) return error
    ? <div className="notice error" role="alert">{error} <button className="text-button" onClick={() => void refresh()}>Retry</button></div>
    : <p className="muted" role="status">Loading your activity…</p>;

  const pendingOffers = activity.received.filter((row) => row.amount !== null && row.status === 'Pending');
  const figures = [
    { label: 'Available', count: activity.listings.filter((item) => listingStatus(item) === 'Available').length, icon: LayoutGrid },
    { label: 'Reserved', count: activity.listings.filter((item) => listingStatus(item) === 'Reserved').length, icon: Clock3 },
    { label: 'Sold', count: activity.listings.filter((item) => listingStatus(item) === 'Sold').length, icon: Check },
    { label: 'Pending offers', count: pendingOffers.length, icon: CircleDollarSign },
  ];
  const enquiries = selected === 'received' ? activity.received : selected === 'offers' ? pendingOffers : activity.sent;

  async function markRead() {
    setReadError('');
    setMarking(true);
    try { await api('/activity/read', { method: 'PATCH' }); await refresh(); }
    catch (error) { setReadError(errorText(error)); }
    finally { setMarking(false); }
  }

  return <>
    <div className="stats-grid">{figures.map(({ label, count, icon: Icon }) =>
      <div className="panel stat" key={label}><span className="stat-icon"><Icon size={20} /></span><div><strong>{count}</strong><span>{label}</span></div></div>,
    )}</div>
    <nav className="dashboard-tabs" aria-label="Dashboard sections">{tabs.map(({ id, title, icon: Icon }) =>
      <Link key={id} href={id === 'listings' ? '/dashboard' : '/dashboard?tab=' + id} aria-current={id === selected ? 'page' : undefined}>
        <Icon size={17} />{title}{id === 'sent' && activity.unread > 0 && <span className="filter-count">{activity.unread}</span>}
      </Link>,
    )}</nav>
    {selected === 'listings' ? <DashboardListings listings={activity.listings} />
      : selected === 'profile' ? <ProfileEditor key={activity.profile?.id} profile={activity.profile} />
        : <section aria-label={selected === 'sent' ? 'Sent enquiries' : 'Received enquiries'}>
          {selected === 'sent' && activity.unread > 0 && <div className="notice success unread-notice">
            <span><Bell size={17} />{activity.unread} unread {activity.unread === 1 ? 'response' : 'responses'}</span>
            <button className="text-button" onClick={markRead} disabled={marking}>Mark all as read</button>
          </div>}
          {readError && <p className="notice error" role="alert">{readError}</p>}
          {enquiries.length ? <div className="record-list">{enquiries.map((row) => <EnquiryCard key={row.id} row={row} incoming={selected !== 'sent'} />)}</div>
            : <EmptyState title={selected === 'offers' ? 'No pending offers' : 'No enquiries yet'}>
              {selected === 'sent' ? 'Enquiries you send to sellers will appear here.' : 'New messages and offers from students will appear here.'}
            </EmptyState>}
        </section>}
  </>;
}

function DashboardListings({ listings }: { listings: Listing[] }) {
  const [filter, setFilter] = useState<(typeof listingFilters)[number]>('All');
  const filtered = filter === 'All' ? listings : listings.filter((item) => listingStatus(item) === filter);
  return <>
    <div className="listing-filters" aria-label="Filter your listings">{listingFilters.map((value) =>
      <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>,
    )}</div>
    {filtered.length ? <div className="record-list">{filtered.map((item) => <ManageListing listing={item} key={item.id} />)}</div>
      : <EmptyState title={filter === 'All' ? 'You haven’t listed anything yet' : 'No ' + filter.toLowerCase() + ' listings'}
          action={filter === 'All' ? <Link className="button primary" href="/sell">List an item</Link> : undefined}>
        {filter === 'All' ? 'Your published listings and their statuses will appear here.' : 'Choose a different status to see your other listings.'}
      </EmptyState>}
  </>;
}

function ManageListing({ listing }: { listing: Listing }) {
  const { refresh } = useActivity();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const status = listingStatus(listing);

  async function change(update: { active: boolean } | { status: string } | null) {
    if (!update && !window.confirm('Delete “' + listing.name + '”? Its enquiry history will still be available.')) return;
    setBusy(true);
    setError('');
    try {
      await api('/listings/' + listing.id, update ? json('PATCH', update) : { method: 'DELETE' });
      await refresh();
    } catch (error) { setError(errorText(error)); }
    finally { setBusy(false); }
  }

  return <article className="panel managed-listing">
    <div className="manage-info">
      <div className="manage-photo"><ListingImage src={listing.photos[0]} alt="" /></div>
      <div><span className={'pill status-' + status.toLowerCase()}>{status}</span>
        <h3>{listing.deleted ? listing.name : <Link href={'/listing/' + listing.id}>{listing.name}</Link>}</h3>
        <span className="muted">{listingPrice(listing)} · {listing.category}</span>
      </div>
    </div>
    {!listing.deleted && <div className="manage-actions">
      <select aria-label={'Status for ' + listing.name} value={listing.status} disabled={busy}
        onChange={(event) => void change({ status: event.target.value })}>
        {STATUSES.map((value) => <option key={value}>{value}</option>)}
      </select>
      <Link className="button secondary small" href={'/dashboard/edit/' + listing.id}><PencilLine size={15} />Edit</Link>
      <button className="button secondary small" disabled={busy} onClick={() => void change({ active: !listing.active })}>
        {listing.active ? <Archive size={15} /> : <Eye size={15} />}{listing.active ? 'Deactivate' : 'Reactivate'}
      </button>
      <button className="icon-button danger" aria-label={'Delete ' + listing.name} disabled={busy} onClick={() => void change(null)}><Trash2 size={17} /></button>
    </div>}
    {error && <p className="notice error" role="alert">{error}</p>}
  </article>;
}

function EnquiryCard({ row, incoming }: { row: Enquiry; incoming: boolean }) {
  const { refresh } = useActivity();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const offer = row.amount !== null;
  const unread = !incoming && row.respondedAt && !row.readAt;

  async function reply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = new FormData(event.currentTarget).get('response');
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const status = submitter?.value ?? 'Replied';
    setBusy(true);
    setError('');
    try { await api('/enquiries/' + row.id, json('PATCH', { status, response })); await refresh(); }
    catch (error) { setError(errorText(error)); }
    finally { setBusy(false); }
  }

  return <article className={'panel enquiry-card' + (unread ? ' unread' : '')}>
    <div className="enquiry-heading"><div><span className="muted">{offer ? 'Price offer' : 'Enquiry'} · {formatDate(row.createdAt)}</span>
      <h3>{row.listingVisible ? <Link href={'/listing/' + row.listingId}>{row.listingName}</Link> : row.listingName}</h3>
    </div><span className={'pill status-' + row.status.toLowerCase()}>{row.status}</span></div>
    {incoming && <div className="enquiry-buyer">From {row.buyerName}</div>}
    <p className="message-copy">{row.message}</p>
    {row.amount !== null && <strong className="offer-amount">{formatPrice(row.amount)} offered</strong>}
    {row.respondedAt && <div className="response-copy"><strong>{incoming ? 'Your response' : 'Seller response'} · {formatDate(row.respondedAt)}</strong>
      <p className="message-copy">{row.response || (row.status === 'Accepted' ? 'The offer was accepted.' : 'The offer was declined.')}</p></div>}
    {incoming && row.status === 'Pending' && (!expanded
      ? <button className="button secondary small" onClick={() => setExpanded(true)}>{offer ? 'Review offer' : 'Reply'}</button>
      : <form className="response-form" onSubmit={reply}>
          <label>{offer ? 'Message to buyer (optional)' : 'Reply to buyer'}<textarea name="response" rows={3} required={!offer} minLength={offer ? undefined : 2} maxLength={1600} /></label>
          <div className="inline-actions">
            {offer ? <>
              {row.acceptingOffers && <button className="button primary" type="submit" value="Accepted" disabled={busy}>Accept offer</button>}
              <button className="button secondary" type="submit" value="Rejected" disabled={busy}>Reject offer</button>
            </> : <button className="button primary" type="submit" value="Replied" disabled={busy}>Send reply</button>}
            <button className="text-button" type="button" onClick={() => setExpanded(false)}>Cancel</button>
          </div>
          {error && <p className="notice error" role="alert">{error}</p>}
        </form>)}
  </article>;
}

function ProfileEditor({ profile }: { profile: Seller | null }) {
  const { refresh } = useActivity();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ error: false, message: '' });

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setStatus({ error: false, message: '' });
    try {
      await api('/profile', json('PUT', readProfile(form)));
      await refresh();
      setStatus({ error: false, message: 'Profile saved.' });
    } catch (error) {
      setStatus({ error: true, message: errorText(error) });
    } finally { setBusy(false); }
  }

  return <form className="panel form-section profile-editor" onSubmit={save}>
    <h2>Public seller profile</h2>
    <ProfileFields profile={profile} />
    {status.message && <p className={'notice ' + (status.error ? 'error' : 'success')} role={status.error ? 'alert' : 'status'}>{status.message}</p>}
    <div className="inline-actions"><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      {profile && <Link className="button secondary" href={'/seller/' + profile.id}>View public profile</Link>}</div>
  </form>;
}
