import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Dashboard } from '@/components/dashboard';

export const metadata: Metadata = { title: 'Your dashboard' };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const selected = tab === 'received' || tab === 'offers' || tab === 'sent' || tab === 'profile' ? tab : 'listings';
  return <main className="shell inner-page dashboard-page">
    <div className="page-heading dashboard-heading"><div><h1>Your dashboard</h1><p>Manage your listings, enquiries, and offers.</p></div>
      <Link className="button primary" href="/sell"><Plus size={18} />List an item</Link>
    </div>
    <Dashboard selected={selected} />
  </main>;
}
