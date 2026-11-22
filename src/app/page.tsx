import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, GraduationCap, Plus, Search } from 'lucide-react';
import { EmptyState, ListingGrid } from '@/components/listing-card';
import { MarketFilters } from '@/components/market-filters';
import { PAGE_SIZE, type Market } from '@/lib/catalog';
import { marketHref } from '@/lib/market-url';
import { marketplace } from '@/server/service';
import { searchSchema } from '@/server/validation';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const parsed = searchSchema.safeParse(Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])));
  const query = parsed.success ? parsed.data : searchSchema.parse({});
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '' && !(key === 'page' && value === 1)) params[key] = String(value);
  }
  let market: Market = { items: [], total: 0, page: 1 };
  let dbUnavailable = false;
  try {
    market = await marketplace(query);
  } catch (error) {
    dbUnavailable = true;
    console.error('Marketplace browse failed', error instanceof Error ? error.name : 'Unknown error');
  }
  const filtered = Boolean(query.q || query.category || query.condition || query.min !== undefined || query.max !== undefined);
  const pages = Math.ceil(market.total / PAGE_SIZE);

  return <main className="shell home">
    <section className="hero" aria-labelledby="home-title">
      <div className="hero-art"><Image src="/market/hero.webp" alt="" fill sizes="(max-width: 720px) 100vw, 1050px" preload unoptimized /></div>
      <div className="hero-shade" />
      <div className="hero-content">
        <span className="hero-eyebrow"><GraduationCap size={17} /> THE STUDENT MARKETPLACE</span>
        <h1 id="home-title">Good finds.<br /><em>Better second-hand.</em></h1>
        <p>Buy, sell, and swap campus essentials with fellow students. Give good things another semester.</p>
        <div className="hero-actions">
          <a className="button hero-primary" href="#market"><Search size={18} />Browse listings</a>
          <Link className="button hero-secondary" href="/sell"><Plus size={19} />List an item</Link>
        </div>
      </div>
    </section>
    <section className="market-section" id="market" aria-labelledby="market-title">
      <MarketFilters key={new URLSearchParams(params).toString()} params={params} />
      <div className="section-heading">
        <h2 id="market-title">{filtered ? query.category ?? 'Search results' : 'Fresh finds'}</h2>
        {!dbUnavailable && <span>{market.total} {market.total === 1 ? 'listing' : 'listings'}</span>}
      </div>
      {!parsed.success && <p role="alert" className="notice error">Some search filters were invalid and have been reset.</p>}
      {dbUnavailable ? <EmptyState title="Listings are temporarily unavailable" action={<Link href={marketHref(params)} className="button secondary">Try again</Link>}>Please check back in a moment.</EmptyState>
        : market.items.length ? <ListingGrid items={market.items} />
          : <EmptyState title={filtered || market.page > 1 ? 'No listings found' : 'Be the first to list something'}
              action={<Link className="button primary" href={filtered || market.page > 1 ? '/#market' : '/sell'}>{filtered || market.page > 1 ? 'Clear filters' : 'List an item'}</Link>}>
              {filtered ? 'Try a different search or remove a filter.' : 'Give your textbooks, tech, or study essentials a second home.'}
            </EmptyState>}
      {pages > 1 && <nav className="pagination" aria-label="Listing pages">
        {market.page > 1 && <Link className="button secondary" href={marketHref(params, { page: String(market.page - 1) })}><ChevronLeft size={17} /> Previous</Link>}
        <span>Page {market.page} of {pages}</span>
        {market.page < pages && <Link className="button secondary" href={marketHref(params, { page: String(market.page + 1) })}>Next <ChevronRight size={17} /></Link>}
      </nav>}
    </section>
  </main>;
}
