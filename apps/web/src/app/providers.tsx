'use client';

import { SessionProvider } from 'next-auth/react';
import { Footer } from '@/components/Footer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">{children}</div>
        <Footer />
      </div>
    </SessionProvider>
  );
}
