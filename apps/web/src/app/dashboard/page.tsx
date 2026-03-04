'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import UploadZone from '@/components/UploadZone';
import ConversionHistory from '@/components/ConversionHistory';
import { apiClient } from '@/lib/api-client';

interface UserProfile {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  subscription: {
    tier: string;
    status: string;
  };
  todayUsage: {
    conversionsCount: number;
    bytesProcessed: number;
  };
  quotaLimits: {
    maxConversionsPerDay: number;
    maxFileSizeBytes: number;
    allowOCR: boolean;
    allowBatch: boolean;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  console.log('Dashboard - Session status:', status);
  console.log('Dashboard - Session data:', session);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      apiClient.setAccessToken((session as any)?.accessToken);
      const data = await apiClient.getUserProfile();
      
      if (data.success && data.data) {
        setProfile(data.data as UserProfile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (conversionId: string) => {
    if (conversionId) {
      setUploadSuccess(`Conversion started! ID: ${conversionId}`);
    } else {
      setUploadSuccess('Conversion completed!');
    }
    setUploadError(null);
    // Refresh profile and history to update usage
    fetchProfile();
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadSuccess(null);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const usagePercentage = profile.quotaLimits.maxConversionsPerDay > 0
    ? (profile.todayUsage.conversionsCount / profile.quotaLimits.maxConversionsPerDay) * 100
    : 0;

  return (
    <div className="bg-gray-50 py-8">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">OmniConvert</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {profile.user.email}
              </span>
              <button
                onClick={() => router.push('/api/auth/signout')}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Subscription</h3>
            <p className="text-2xl font-bold text-gray-900 capitalize">
              {profile.subscription.tier}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Status: {profile.subscription.status}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Today's Usage</h3>
            <p className="text-2xl font-bold text-gray-900">
              {profile.todayUsage.conversionsCount}
              <span className="text-sm font-normal text-gray-500">
                {' '}/ {profile.quotaLimits.maxConversionsPerDay === -1 
                  ? '∞' 
                  : profile.quotaLimits.maxConversionsPerDay}
              </span>
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Max File Size</h3>
            <p className="text-2xl font-bold text-gray-900">
              {profile.quotaLimits.maxFileSizeBytes / (1024 * 1024)} MB
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {profile.quotaLimits.allowOCR ? 'OCR Enabled' : 'OCR Disabled'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Convert Files</h2>
          
          {uploadError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {uploadError}
            </div>
          )}
          
          {uploadSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {uploadSuccess}
            </div>
          )}

          <UploadZone
            onUploadComplete={handleUploadComplete}
            onError={handleUploadError}
          />
        </div>

        {/* Recent Conversions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Conversions</h2>
          <ConversionHistory />
        </div>
      </div>
    </div>
  );
}
