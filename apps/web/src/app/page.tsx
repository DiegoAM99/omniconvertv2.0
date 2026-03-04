'use client';

import Link from 'next/link';
import UploadZone from '@/components/UploadZone';

export default function HomePage() {
  return (
    <main className="py-12 relative overflow-hidden">
      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            OmniConvert
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Universal file conversion made simple and secure
          </p>
          <div className="inline-flex gap-4">
            <Link
              href="/auth/signup"
              className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition"
            >
              Get Started Free
            </Link>
            <Link
              href="/auth/login"
              className="px-6 py-3 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-500 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-slate-700 transition"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Upload Zone Placeholder */}
        <div className="max-w-3xl mx-auto">
          <UploadZone 
            onUploadComplete={(conversionId) => {
              console.log('Upload complete:', conversionId);
            }}
            onError={(error) => {
              console.error('Upload error:', error);
            }}
          />
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2 dark:text-white">Smart Detection</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Automatic file type recognition - no guessing required
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold mb-2 dark:text-white">Lightning Fast</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Most conversions complete in under 10 seconds
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold mb-2 dark:text-white">Secure & Private</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Files auto-delete after 24 hours, encrypted in transit
            </p>
          </div>
        </div>

        {/* Supported Formats */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 dark:text-white">Supported Formats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow dark:shadow-slate-900/50">
              <h4 className="font-semibold mb-2 dark:text-white">Documents</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">PDF, DOCX, XLSX, PPTX, TXT, CSV, EPUB, MOBI</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow dark:shadow-slate-900/50">
              <h4 className="font-semibold mb-2 dark:text-white">Images</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">JPG, PNG, WEBP, GIF, SVG, HEIC, TIFF</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow dark:shadow-slate-900/50">
              <h4 className="font-semibold mb-2 dark:text-white">Audio</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">MP3, WAV, AAC, FLAC, OGG</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow dark:shadow-slate-900/50">
              <h4 className="font-semibold mb-2 dark:text-white">Video</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">MP4, MOV, AVI, MKV, WEBM</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
