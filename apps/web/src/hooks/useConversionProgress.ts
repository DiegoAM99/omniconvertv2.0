'use client';

import { useEffect, useState } from 'react';

interface ProgressData {
  type: 'connected' | 'progress' | 'done' | 'error';
  status?: string;
  progress?: {
    stage: string;
    percentage: number;
    message?: string;
  };
  conversionId?: string;
  message?: string;
}

export function useConversionProgress(conversionId: string | null) {
  const [status, setStatus] = useState<string>('pending');
  const [progress, setProgress] = useState<number>(0);
  const [stage, setStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [outputFormat, setOutputFormat] = useState<string>('');

  useEffect(() => {
    if (!conversionId) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const eventSource = new EventSource(`${API_URL}/api/progress/${conversionId}`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressData = JSON.parse(event.data);

        if (data.type === 'connected') {
          setStatus('connected');
        } else if (data.type === 'progress') {
          if (data.status) {
            setStatus(data.status);
          }
          if (data.progress) {
            setProgress(data.progress.percentage);
            setStage(data.progress.stage);
          }
        } else if (data.type === 'done') {
          setStatus(data.status || 'completed');
          setProgress(100);
          eventSource.close();
          setIsConnected(false);
        } else if (data.type === 'error') {
          setError(data.message || 'Unknown error');
          eventSource.close();
          setIsConnected(false);
        }
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
      }
    };

    eventSource.onerror = () => {
      setError('Connection lost');
      eventSource.close();
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [conversionId]);

  return {
    status,
    progress,
    stage,
    error,
    isConnected,
    outputFormat,
  };
}
