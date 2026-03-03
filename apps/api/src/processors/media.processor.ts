import axios from 'axios';
import { AudioFormat, VideoFormat } from '@omniconvert/types';
import { logger } from '../config/logger';

export interface MediaConversionOptions {
  quality?: 'high' | 'medium' | 'low';
  videoBitrate?: string; // e.g., '1000k'
  audioBitrate?: string; // e.g., '128k'
  resolution?: string; // e.g., '1920x1080'
  fps?: number;
}

interface CloudConvertJob {
  id: string;
  status: 'waiting' | 'processing' | 'finished' | 'error';
  result?: {
    files: Array<{
      filename: string;
      url: string;
    }>;
  };
  message?: string;
}

export class MediaProcessor {
  private static readonly API_KEY = process.env.CLOUDCONVERT_API_KEY || '';
  private static readonly API_URL = 'https://api.cloudconvert.com/v2';

  static async convert(
    inputBuffer: Buffer,
    inputFormat: AudioFormat | VideoFormat,
    outputFormat: AudioFormat | VideoFormat,
    options: MediaConversionOptions = {}
  ): Promise<Buffer> {
    try {
      logger.info(`Converting media from ${inputFormat} to ${outputFormat} via CloudConvert`);

      if (!this.API_KEY) {
        throw new Error('CloudConvert API key not configured');
      }

      // Step 1: Create a job
      const job = await this.createJob(inputFormat, outputFormat, options);

      // Step 2: Upload file
      await this.uploadFile(job.id, inputBuffer, inputFormat);

      // Step 3: Wait for completion
      const completedJob = await this.waitForCompletion(job.id);

      // Step 4: Download result
      if (!completedJob.result?.files?.[0]?.url) {
        throw new Error('No output file in CloudConvert result');
      }

      const outputBuffer = await this.downloadFile(completedJob.result.files[0].url);
      
      logger.info(`Media conversion completed. Output size: ${outputBuffer.length} bytes`);
      return outputBuffer;
    } catch (error: any) {
      logger.error('Media conversion failed:', error);
      throw new Error(`Media conversion failed: ${error.message}`);
    }
  }

  private static async createJob(
    inputFormat: string,
    outputFormat: string,
    options: MediaConversionOptions
  ): Promise<CloudConvertJob> {
    const response = await axios.post(
      `${this.API_URL}/jobs`,
      {
        tasks: {
          'import-file': {
            operation: 'import/upload',
          },
          'convert-file': {
            operation: 'convert',
            input: 'import-file',
            output_format: outputFormat,
            some_other_option: options.quality,
            video_bitrate: options.videoBitrate,
            audio_bitrate: options.audioBitrate,
            video_resolution: options.resolution,
            video_fps: options.fps,
          },
          'export-file': {
            operation: 'export/url',
            input: 'convert-file',
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data;
  }

  private static async uploadFile(
    jobId: string,
    buffer: Buffer,
    format: string
  ): Promise<void> {
    // Get upload task
    const jobResponse = await axios.get(`${this.API_URL}/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${this.API_KEY}` },
    });

    const uploadTask = jobResponse.data.data.tasks.find(
      (t: any) => t.operation === 'import/upload'
    );

    if (!uploadTask?.result?.form?.url) {
      throw new Error('No upload URL in CloudConvert job');
    }

    // Upload file
    const formData = new FormData();
    const blob = new Blob([buffer], { type: `application/${format}` });
    formData.append('file', blob, `input.${format}`);

    await axios.post(uploadTask.result.form.url, formData, {
      headers: uploadTask.result.form.parameters,
    });
  }

  private static async waitForCompletion(
    jobId: string,
    maxWaitTime: number = 300000 // 5 minutes
  ): Promise<CloudConvertJob> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const response = await axios.get(`${this.API_URL}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${this.API_KEY}` },
      });

      const job: CloudConvertJob = response.data.data;

      if (job.status === 'finished') {
        return job;
      }

      if (job.status === 'error') {
        throw new Error(`CloudConvert job failed: ${job.message}`);
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error('CloudConvert conversion timeout');
  }

  private static async downloadFile(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
  }
}
