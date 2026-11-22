'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, ChevronDown, Grid2X2, Laptop, Layers3, PencilLine, Search, SlidersHorizontal, Sofa, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { CATEGORIES, CONDITIONS, MAX_PRICE } from '@/lib/catalog';
import { marketHref } from '@/lib/market-url';

const categories = [
  { text: 'All items', icon: Grid2X2, color: 'all' },
  { text: 'Books', icon: BookOpen, color: 'books' },
  { text: 'Electronics', icon: Laptop, color: 'electronics' },
  { text: 'Furniture', icon: Sofa, color: 'furniture' },
  { text: 'Stationery', icon: PencilLine, color: 'stationery' },
  { text: 'Other', icon: Layers3, color: 'other' },
];

export function MarketFilters({ params }: { params: Record<string, string> }) {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(params.q ?? '');
  const filterCount = Number(Boolean(params.condition)) + Number(Boolean(params.min || params.max));

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = search.trim();
    router.push(marketHref(params, { q, page: undefined, sort: q && (!params.sort || params.sort === 'newest') ? 'relevance' : params.sort }));
  }

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const min = String(form.get('min') ?? '');
    const max = String(form.get('max') ?? '');
    const maxField = event.currentTarget.elements.namedItem('max') as HTMLInputElement;
    if (min && max && Number(max) < Number(min)) {
      maxField.setCustomValidity('Maximum price must be at least the minimum price.');
      maxField.reportValidity();
      return;
    }
    maxField.setCustomValidity('');
    setShowFilters(false);
    router.push(marketHref(params, { condition: String(form.get('condition') ?? ''), min, max, page: undefined }));
  }

  return <>
    <div className="category-bar" aria-label="Categories">
      {categories.map(({ text, icon: Icon, color }) => {
        const category = CATEGORIES.find((value) => value === text);
        const selected = category === params.category;
        return <Link key={text} className={'category-pill' + (selected ? ' selected' : '')} aria-current={selected ? 'true' : undefined}
          href={marketHref(params, { category, page: undefined })}>
          <span className={'category-icon ' + color}><Icon size={17} strokeWidth={1.9} /></span>{text}
        </Link>;
      })}
    </div>
    <div className="discovery-controls">
      <form className="search-form" onSubmit={submitSearch}>
        <Search size={20} />
        <input aria-label="Search marketplace" type="search" placeholder="Search textbooks, calculators, furniture…" maxLength={120} value={search} onChange={(event) => setSearch(event.target.value)} />
        <button type="submit" className="button primary">Search</button>
      </form>
      <button type="button" className="button secondary" aria-expanded={showFilters} aria-controls="market-filters"
        onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={17} /> Filters{filterCount > 0 && <span className="filter-count">{filterCount}</span>}</button>
      <label className="sort-control">
        <span>Sort by</span>
        <select aria-label="Sort listings" value={params.sort ?? 'newest'} onChange={(event) => router.push(marketHref(params, { sort: event.target.value, page: undefined }))}>
          <option value="newest">Newest</option><option value="price-low">Price low to high</option>
          <option value="price-high">Price high to low</option><option value="relevance">Relevance</option>
        </select><ChevronDown size={15} />
      </label>
    </div>
    {showFilters && <form id="market-filters" className="filter-panel" onSubmit={apply}
      onChange={(event) => (event.currentTarget.elements.namedItem('max') as HTMLInputElement).setCustomValidity('')}>
      <label>Condition <select name="condition" defaultValue={params.condition ?? ''}><option value="">Any condition</option>{CONDITIONS.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Min price (₹) <input type="number" name="min" min={0} max={MAX_PRICE} step="0.01" defaultValue={params.min} placeholder="0" /></label>
      <label>Max price (₹) <input type="number" name="max" min={0} max={MAX_PRICE} step="0.01" defaultValue={params.max} placeholder="No limit" /></label>
      <button type="submit" className="button primary">Apply filters</button>
    </form>}
    {(params.q || filterCount > 0) && <div className="active-filters">
      {params.q && <Link href={marketHref(params, { q: undefined, page: undefined })}>“{params.q}” <X size={14} /></Link>}
      {params.condition && <Link href={marketHref(params, { condition: undefined, page: undefined })}>{params.condition} <X size={14} /></Link>}
      {(params.min || params.max) && <Link href={marketHref(params, { min: undefined, max: undefined, page: undefined })}>{params.max ? `₹${params.min ?? 0}–₹${params.max}` : `₹${params.min}+`} <X size={14} /></Link>}
    </div>}
  </>;
}
