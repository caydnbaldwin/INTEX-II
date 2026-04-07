import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CookieConsentBanner from '@/components/CookieConsentBanner';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background">
        {children}
      </main>
      <Footer />
      <CookieConsentBanner />
    </>
  );
}
