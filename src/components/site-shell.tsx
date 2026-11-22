'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Heart, LayoutGrid, Plus, Repeat2, Store } from 'lucide-react';
import { useActivity } from './activity-provider';

export function Brand() {
  return <Link href="/" className="brand" aria-label="Campus Loop home">
    <span className="brand-icon"><Repeat2 size={23} strokeWidth={2.4} /></span>
    <span>campus<span className="brand-accent">loop</span></span>
  </Link>;
}

export function SiteHeader() {
  const pathname = usePathname();
  const { activity } = useActivity();
  const unread = activity?.unread ?? 0;
  const links = [
    { href: '/', title: 'Marketplace', active: pathname === '/' || pathname.startsWith('/listing/') || pathname.startsWith('/seller/'), icon: Store },
    { href: '/saved', title: 'Saved', active: pathname === '/saved', icon: Heart },
    { href: '/dashboard', title: 'Dashboard', active: pathname === '/dashboard', icon: LayoutGrid },
  ];

  return <header className="site-header">
    <div className="shell header-content">
      <Brand />
      <nav className="main-nav" aria-label="Main navigation">
        {links.map(({ href, title, active, icon: Icon }) => <Link key={href} href={href} className={active ? 'nav-link active' : 'nav-link'} aria-current={active ? 'page' : undefined}>
          <Icon size={17} /><span>{title}</span>
        </Link>)}
      </nav>
      <div className="header-actions">
        <Link href="/dashboard?tab=sent" className="icon-button notification-button" aria-label={unread ? `${unread} unread enquiry responses` : 'Enquiry responses'}>
          <Bell size={20} />{unread > 0 && <span className="notification-count">{unread > 99 ? '99+' : unread}</span>}
        </Link>
        <Link href="/sell" className="button primary sell-link"><Plus size={18} /><span>Sell an item</span></Link>
      </div>
    </div>
  </header>;
}

export function SiteFooter() {
  return <footer className="site-footer"><div className="shell footer-content">
    <Brand />
    <span>Second-hand finds for student life.</span>
    <Link href="/sell">List an item</Link>
  </div></footer>;
}
