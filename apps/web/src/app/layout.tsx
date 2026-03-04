import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'OmniConvert - Universal File Conversion Platform',
  description: 'Convert documents, images, audio, and video files with intelligent format detection.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased flex flex-col min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
        <Providers>
          <main className="flex-grow">{children}</main>
        </Providers>
        <ThemeToggle />
        <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/80 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Developed by:{' '}
              <a
                href="https://www.linkedin.com/in/diego-%C3%A1lvarez-medrano/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
              >
                Diego Álvarez Medrano
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
