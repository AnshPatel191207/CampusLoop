'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, ChevronLeft, CircleDollarSign, Gift, Repeat2, Upload, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { CATEGORIES, CONDITIONS, MAX_PHOTOS, MAX_PHOTO_BYTES, MAX_PRICE, type Listing } from '@/lib/catalog';
import { api, errorText, useActivity } from './activity-provider';
import { ProfileFields, readProfile } from './profile-fields';

const listingTypes = [{ name: 'For Sale', icon: CircleDollarSign }, { name: 'Free', icon: Gift }, { name: 'Exchange', icon: Repeat2 }] as const;
type UploadPhoto = { file: File; preview: string };

async function compress(file: File): Promise<UploadPhoto> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 20_000_000) {
    throw new Error('Choose a JPEG, PNG, or WebP photo up to 20 MB.');
  }
  const image = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) { image.close(); throw new Error('This browser could not prepare the photo.'); }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  const encoded = canvas.toDataURL('image/webp', 0.8);
  const blob = await fetch(encoded).then((response) => response.blob());
  if (blob.size > MAX_PHOTO_BYTES) throw new Error('This photo is too large after compression. Choose a smaller version.');
  return { file: new File([blob], file.name, { type: blob.type }), preview: encoded };
}

export function ListingForm({ listing }: { listing?: Listing }) {
  const router = useRouter();
  const { activity, error: activityError, refresh } = useActivity();
  const [type, setType] = useState(listing?.type ?? 'For Sale');
  const [retained, setRetained] = useState(listing?.photos ?? []);
  const [photos, setPhotos] = useState<UploadPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState('');
  const upload = useRef<HTMLInputElement>(null);
  const needsProfile = !listing && !activity?.profile;
  const photoCount = retained.length + photos.length;

  async function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (!files.length) return;
    if (photoCount + files.length > MAX_PHOTOS) {
      setError('You can add up to three photos.');
      return;
    }
    setPreparing(true);
    setError('');
    try {
      const incoming = await Promise.all(files.map(compress));
      setPhotos((previous) => [...previous, ...incoming]);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setPreparing(false);
    }
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!photoCount) { setError('Add at least one product photo.'); return; }
    const form = new FormData(event.currentTarget);
    const data = {
      name: form.get('name'), description: form.get('description'), category: form.get('category'),
      condition: form.get('condition'), price: type === 'For Sale' ? Number(form.get('price')) : 0,
      type, keepPhotos: retained, profile: needsProfile ? readProfile(form) : undefined,
    };
    const payload = new FormData();
    payload.set('listing', JSON.stringify(data));
    photos.forEach(({ file }) => payload.append('photos', file));
    setBusy(true);
    try {
      const saved = await api<Listing>(listing ? '/listings/' + listing.id : '/listings', { method: listing ? 'PUT' : 'POST', body: payload });
      await refresh();
      router.push('/listing/' + saved.id);
      router.refresh();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return <form className="edit-form" onSubmit={publish}>
    <section className="panel form-section">
      <h2><Camera size={20} /> Photos</h2>
      <p className="muted">Add up to three photos. The first one appears in the marketplace.</p>
      <div className="upload-grid">
        {retained.map((src, index) => <div className="upload-preview" key={src}>
          <Image src={src} alt={'Listing photo ' + (index + 1)} fill unoptimized />
          <button type="button" className="icon-button" aria-label={'Remove photo ' + (index + 1)} onClick={() => setRetained((images) => images.filter((value) => value !== src))}><X size={17} /></button>
        </div>)}
        {photos.map(({ preview }, index) => <div className="upload-preview" key={index}>
          <Image src={preview} alt={'New listing photo ' + (index + 1)} fill unoptimized />
          <button type="button" className="icon-button" aria-label={'Remove new photo ' + (index + 1)} onClick={() => setPhotos((images) => images.filter((_, position) => position !== index))}><X size={17} /></button>
        </div>)}
        {photoCount < MAX_PHOTOS && <button type="button" className="upload-slot" disabled={preparing} onClick={() => upload.current?.click()}><Upload size={24} /><strong>{preparing ? 'Preparing…' : 'Add photos'}</strong><span>JPEG, PNG or WebP</span></button>}
        <input ref={upload} hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addPhotos} />
      </div>
    </section>
    <section className="panel form-section">
      <h2>Listing details</h2>
      <label>Title<input name="name" required minLength={3} maxLength={100} defaultValue={listing?.name} placeholder="e.g. Casio scientific calculator" /></label>
      <label>Description<textarea name="description" rows={5} required minLength={10} maxLength={2000} defaultValue={listing?.description} placeholder="Describe its condition, what’s included, and where you can meet." /></label>
      <div className="field-grid">
        <label>Category<select name="category" required defaultValue={listing?.category ?? ''}><option value="" disabled>Select a category</option>{CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Condition<select name="condition" required defaultValue={listing?.condition ?? ''}><option value="" disabled>Select a condition</option>{CONDITIONS.map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>
      <fieldset className="type-grid"><legend>Listing type</legend>
        {listingTypes.map(({ name, icon: Icon }) => <label className="type-choice" key={name}>
          <input type="radio" name="type" value={name} checked={type === name} onChange={() => setType(name)} />
          <span><Icon size={19} />{name}</span>
        </label>)}
      </fieldset>
      {type === 'For Sale' && <label>Price (₹)<input name="price" type="number" required min="0.01" max={MAX_PRICE} step="0.01" defaultValue={listing?.price || undefined} placeholder="0.00" /></label>}
    </section>
    {needsProfile && <section className="panel form-section"><h2>Seller profile</h2><p className="muted">Students will see these details when they open your listing.</p><ProfileFields /></section>}
    {!listing && !activity && activityError && <p className="notice error" role="alert">{activityError} <button type="button" className="text-button" onClick={() => void refresh()}>Retry</button></p>}
    {error && <p className="notice error" role="alert">{error}</p>}
    <div className="form-actions">
      <Link className="button secondary" href={listing ? '/dashboard' : '/'}><ChevronLeft size={17} />Cancel</Link>
      <button className="button primary" type="submit" disabled={busy || preparing || (!listing && !activity)}>{busy ? 'Saving…' : listing ? 'Save changes' : 'Publish listing'}</button>
    </div>
  </form>;
}
