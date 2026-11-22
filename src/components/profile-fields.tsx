import { CONTACT_METHODS, type Seller } from '@/lib/catalog';

export function readProfile(form: FormData) {
  return {
    name: String(form.get('sellerName') ?? ''),
    campus: String(form.get('campus') ?? ''),
    contact: String(form.get('contact') ?? ''),
    bio: String(form.get('bio') ?? ''),
  };
}

export function ProfileFields({ profile }: { profile?: Seller | null }) {
  return <>
    <div className="field-grid">
      <label>Display name<input name="sellerName" autoComplete="name" required minLength={2} maxLength={70} placeholder="e.g. Aisha Rao" defaultValue={profile?.name} /></label>
      <label>Campus<input name="campus" required minLength={2} maxLength={80} placeholder="e.g. North Campus" defaultValue={profile?.campus} /></label>
    </div>
    <label>Contact preference<select name="contact" defaultValue={profile?.contact}>{CONTACT_METHODS.map((value) => <option key={value}>{value}</option>)}</select></label>
    <label>About <span className="optional">(optional)</span><textarea name="bio" rows={3} maxLength={400} defaultValue={profile?.bio} placeholder="A short introduction for other students" /></label>
  </>;
}
