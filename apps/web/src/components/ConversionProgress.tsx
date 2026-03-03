'use client';

import { useConversionProgress } from '@/hooks/useConversionProgress';

interface ConversionProgressProps {
  conversionId: string;
  outputFormat?: string;
  fileName?: string;
  onComplete?: () => void;
}

export default function ConversionProgress({ conversionId, outputFormat: providedOutputFormat, fileName, onComplete }: ConversionProgressProps) {
  const { status, progress, stage, error, isConnected, outputFormat: detectedOutputFormat } = useConversionProgress(conversionId);
  
  const finalOutputFormat = providedOutputFormat || detectedOutputFormat || 'pdf';
  const downloadFileName = fileName 
    ? `${fileName.split('.')[0]}.${finalOutputFormat}`
    : `converted-file.${finalOutputFormat}`;

  const handleDownload = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const downloadUrl = `${API_URL}/api/conversions/${conversionId}/download`;
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      downloading: 'Downloading file',
      processing: 'Converting file',
      uploading: 'Uploading result',
      completed: 'Completed',
    };
    return labels[stage] || stage;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      queued: 'text-gray-600',
      processing: 'text-blue-600',
      completed: 'text-green-600',
      failed: 'text-red-600',
    };
    return colors[status] || 'text-gray-600';
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-2xl mr-3">❌</div>
          <div>
            <h3 className="font-semibold text-red-900">Connection Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-2xl mr-3">⚠️</div>
          <div>
            <h3 className="font-semibold text-red-900">Conversion Failed</h3>
            <p className="text-sm text-red-700">Please try again or contact support</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="text-3xl mr-3">✅</div>
            <div>
              <h3 className="font-semibold text-green-900 text-lg">Conversion Complete!</h3>
              <p className="text-sm text-green-700">Your file is ready for download</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleDownload}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download {finalOutputFormat ? finalOutputFormat.toUpperCase() : 'File'}</span>
          </button>
          {onComplete && (
            <button
              onClick={onComplete}
              className="w-full bg-white text-gray-700 py-2 px-6 rounded-lg font-medium hover:bg-gray-50 transition border border-gray-300"
            >
              Convert Another File
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className={`font-medium ${getStatusColor(status)}`}>
            {isConnected ? '🔄' : '⏳'} {getStageLabel(stage) || 'Processing...'}
          </span>
          <span className="text-sm font-semibold text-blue-900">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <p className="text-xs text-blue-700">
        {status === 'queued' ? 'Waiting in queue...' : 'Processing your conversion'}
      </p>
    </div>
  );
}
