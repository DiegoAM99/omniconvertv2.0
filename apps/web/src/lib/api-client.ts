const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    return data;
  }

  // Auth endpoints
  async signup(email: string, password: string, name: string) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Upload endpoints
  async initializeUpload(fileName: string, fileSize: number, contentType: string) {
    return this.request<{
      uploadUrl: string;
      fileId: string;
      fileKey: string;
      expiresIn: number;
    }>('/api/uploads/initialize', {
      method: 'POST',
      body: JSON.stringify({ fileName, fileSize, contentType }),
    });
  }

  async uploadToS3(uploadUrl: string, file: File, onProgress?: (progress: number) => void) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  async directUpload(
    file: File,
    inputFormat: string,
    outputFormat: string,
    options?: any,
    onProgress?: (progress: number) => void
  ) {
    return new Promise<ApiResponse<{conversionId: string; status: string; fileId: string}>>((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('inputFormat', inputFormat);
      formData.append('outputFormat', outputFormat);
      if (options) {
        formData.append('options', JSON.stringify(options));
      }

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${this.baseUrl}/api/uploads/direct`);
      if (this.accessToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.accessToken}`);
      }
      xhr.send(formData);
    });
  }

  async completeUpload(
    fileId: string,
    fileName: string,
    fileSize: number,
    inputFormat: string,
    outputFormat: string,
    options?: any
  ) {
    return this.request<{
      conversionId: string;
      status: string;
    }>('/api/uploads/complete', {
      method: 'POST',
      body: JSON.stringify({ fileId, fileName, fileSize, inputFormat, outputFormat, options }),
    });
  }

  // Conversion endpoints
  async getConversion(conversionId: string) {
    return this.request(`/api/conversions/${conversionId}`, {
      method: 'GET',
    });
  }

  async getConversionStatus(conversionId: string) {
    return this.request(`/api/conversions/${conversionId}/status`, {
      method: 'GET',
    });
  }

  // User endpoints
  async getUserProfile() {
    return this.request('/api/user/me', {
      method: 'GET',
    });
  }

  async getUserConversions(limit: number = 50, offset: number = 0) {
    return this.request(`/api/user/me/conversions?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient();
