import type { Metadata } from 'next';
import { ActivityProvider } from '@/components/activity-provider';
import { SiteFooter, SiteHeader } from '@/components/site-shell';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Campus Loop | The student marketplace', template: '%s | Campus Loop' },
  description: 'Buy, sell, swap, and pass on second-hand essentials with students on campus.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <ActivityProvider><SiteHeader />{children}<SiteFooter /></ActivityProvider>
  </body></html>;
}
