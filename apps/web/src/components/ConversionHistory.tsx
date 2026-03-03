'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useSession } from 'next-auth/react';

interface Conversion {
  id: string;
  status: string;
  inputFormat: string;
  outputFormat: string;
  inputFileSize: string;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
}

export default function ConversionHistory() {
  const { data: session } = useSession();
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchConversions();
    }
  }, [session]);

  const fetchConversions = async () => {
    try {
      apiClient.setAccessToken((session as any)?.accessToken);
      const response = await apiClient.getUserConversions(10, 0);
      
      if (response.success && response.data) {
        const data = response.data as any;
        setConversions(data.conversions || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      queued: { color: 'bg-gray-100 text-gray-700', text: 'Queued' },
      processing: { color: 'bg-blue-100 text-blue-700', text: 'Processing' },
      completed: { color: 'bg-green-100 text-green-700', text: 'Completed' },
      failed: { color: 'bg-red-100 text-red-700', text: 'Failed' },
    };

    const badge = badges[status] || badges.queued;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading conversions...</p>
      </div>
    );
  }

  if (conversions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📋</div>
        <p className="text-gray-600">No conversions yet</p>
        <p className="text-sm text-gray-500 mt-1">Upload a file to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversions.map((conversion) => (
        <div
          key={conversion.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm font-semibold text-gray-900">
                  {conversion.inputFormat.toUpperCase()} → {conversion.outputFormat.toUpperCase()}
                </span>
                {getStatusBadge(conversion.status)}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{formatFileSize(conversion.inputFileSize)}</span>
                <span>•</span>
                <span>{formatDate(conversion.createdAt)}</span>
              </div>
            </div>
            {conversion.status === 'completed' && conversion.downloadUrl && (
              <a
                href={conversion.downloadUrl}
                download
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                Download
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
