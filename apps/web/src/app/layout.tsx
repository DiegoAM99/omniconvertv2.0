import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'OmniConvert v2.0 - DEPLOYMENT TEST',
  description: 'Convert documents, images, audio, and video files with intelligent format detection.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased flex flex-col min-h-screen">
        <Providers>
          <main className="flex-grow">{children}</main>
        </Providers>
        <footer className="fixed bottom-0 left-0 right-0 z-50 border-t-4 border-red-600 bg-red-600 text-white py-8 w-full shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xl font-bold">
              🔴 INLINE FOOTER TEST 🔴 Developed by: Diego Álvarez Medrano
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
