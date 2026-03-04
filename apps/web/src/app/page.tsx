'use client';

import Link from 'next/link';
import UploadZone from '@/components/UploadZone';

export default function HomePage() {
  return (
    <main className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
      </div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            OmniConvert
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Universal file conversion made simple and secure
          </p>
          <div className="inline-flex gap-4">
            <Link
              href="/auth/signup"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Get Started Free
            </Link>
            <Link
              href="/auth/login"
              className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
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
            <h3 className="text-lg font-semibold mb-2">Smart Detection</h3>
            <p className="text-gray-600">
              Automatic file type recognition - no guessing required
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-600">
              Most conversions complete in under 10 seconds
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
            <p className="text-gray-600">
              Files auto-delete after 24 hours, encrypted in transit
            </p>
          </div>
        </div>

        {/* Supported Formats */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Supported Formats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-semibold mb-2">Documents</h4>
              <p className="text-sm text-gray-600">PDF, DOCX, XLSX, PPTX, TXT, CSV, EPUB, MOBI</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-semibold mb-2">Images</h4>
              <p className="text-sm text-gray-600">JPG, PNG, WEBP, GIF, SVG, HEIC, TIFF</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-semibold mb-2">Audio</h4>
              <p className="text-sm text-gray-600">MP3, WAV, AAC, FLAC, OGG</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-semibold mb-2">Video</h4>
              <p className="text-sm text-gray-600">MP4, MOV, AVI, MKV, WEBM</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
