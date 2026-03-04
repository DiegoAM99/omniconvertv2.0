'use client';

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t-4 border-red-600 bg-red-600 text-white py-8 w-full shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xl font-bold animate-pulse">
          🔴 FOOTER DEBUG TEST - Developed by:{' '}
          <a
            href="https://www.linkedin.com/in/diego-%C3%A1lvarez-medrano/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white underline hover:text-yellow-300 transition-colors"
          >
            Diego Álvarez Medrano
          </a>
          {' '}🔴
        </p>
      </div>
    </footer>
  );
}
