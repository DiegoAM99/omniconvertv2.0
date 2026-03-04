import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

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
      <body className="font-sans antialiased flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Providers>
          <main className="flex-grow">{children}</main>
        </Providers>
        <footer className="border-t border-gray-200 bg-white mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-sm text-gray-600">
              Developed by:{' '}
              <a
                href="https://www.linkedin.com/in/diego-%C3%A1lvarez-medrano/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
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
