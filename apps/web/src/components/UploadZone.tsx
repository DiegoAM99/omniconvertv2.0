'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { apiClient } from '@/lib/api-client';
import { useSession } from 'next-auth/react';
import ConversionProgress from './ConversionProgress';

interface UploadZoneProps {
  onUploadComplete?: (conversionId: string) => void;
  onError?: (error: string) => void;
}

export default function UploadZone({ onUploadComplete, onError }: UploadZoneProps) {
  const { data: session } = useSession();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [currentConversion, setCurrentConversion] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>('');
  const [convertedFormat, setConvertedFormat] = useState<string>('');

  console.log('UploadZone - Session:', session);
  console.log('UploadZone - Uploading:', uploading);

  const handleFileSelect = useCallback((acceptedFiles: File[]) => {
    console.log('File selected:', acceptedFiles);
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setSelectedFile(file);
    
    // Auto-detect format from file extension
    const inputFormat = file.name.split('.').pop()?.toLowerCase() || '';
    if (!selectedFormat) {
      setSelectedFormat(getDefaultOutputFormat(inputFormat));
    }
  }, [selectedFormat]);

  const handleConvert = async () => {
    if (!selectedFile) return;

    console.log('Starting conversion for:', selectedFile.name);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Set access token if logged in
      if (session) {
        apiClient.setAccessToken((session as any).accessToken);
        console.log('Session token set');
      } else {
        console.log('No session - anonymous upload');
      }

      // Determine input/output formats
      const inputFormat = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      const outputFormat = selectedFormat || getDefaultOutputFormat(inputFormat);
      console.log('Converting ' + inputFormat + ' to ' + outputFormat);

      // Direct upload (avoids CORS issues)
      console.log('Uploading file and creating conversion...');
      const response = await apiClient.directUpload(
        selectedFile,
        inputFormat,
        outputFormat,
        {},
        (progress) => {
          console.log('Upload progress: ' + progress + '%');
          setUploadProgress(progress);
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to upload file');
      }

      console.log('Conversion created:', response.data.conversionId);
      setCurrentConversion(response.data.conversionId);
      setConvertedFileName(selectedFile.name);
      setConvertedFormat(outputFormat);
      setSelectedFile(null);

      if (onUploadComplete) {
        onUploadComplete(response.data.conversionId);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      if (onError) {
        onError(error.message || 'Upload failed');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      handleFileSelect(acceptedFiles);
    },
    [handleFileSelect]
  );

  const handleConversionComplete = () => {
    setCurrentConversion(null);
    setConvertedFileName('');
    setConvertedFormat('');
    if (onUploadComplete) {
      onUploadComplete('');
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: uploading || currentConversion !== null || selectedFile !== null,
    noClick: false,
    noKeyboard: false,
    multiple: false,
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {currentConversion ? (
        <ConversionProgress
          conversionId={currentConversion}
          outputFormat={convertedFormat}
          fileName={convertedFileName}
          onComplete={handleConversionComplete}
        />
      ) : selectedFile ? (
        /* File Selected View */
        <div className="border-2 border-blue-500 dark:border-blue-400 rounded-xl p-8 bg-blue-50 dark:bg-slate-800">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4 flex-1">
              <div className="text-5xl">📄</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-all">
                  {selectedFile.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {formatBytes(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setSelectedFormat('');
              }}
              className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition ml-4"
              title="Remove file"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Convert to:
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="">Auto-detect best format</option>
                <optgroup label="Documents">
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                  <option value="xlsx">XLSX</option>
                  <option value="txt">TXT</option>
                </optgroup>
                <optgroup label="Images">
                  <option value="jpg">JPG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WEBP</option>
                  <option value="gif">GIF</option>
                </optgroup>
                <optgroup label="Audio">
                  <option value="mp3">MP3</option>
                  <option value="wav">WAV</option>
                  <option value="aac">AAC</option>
                </optgroup>
                <optgroup label="Video">
                  <option value="mp4">MP4</option>
                  <option value="mov">MOV</option>
                  <option value="webm">WEBM</option>
                </optgroup>
              </select>
            </div>

            <button
              onClick={handleConvert}
              disabled={uploading}
              className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading 
                ? `Converting... ${Math.round(uploadProgress)}%` 
                : `Convert to ${selectedFormat ? selectedFormat.toUpperCase() : 'Auto-detect'}`
              }
            </button>

            {uploading && (
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Upload Zone */
        <>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-16 text-center transition cursor-pointer relative
              ${isDragActive ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-slate-800' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ minHeight: '300px' }}
          >
            <input {...getInputProps()} id="file-upload" />
            
            {uploading ? (
              <div>
                <div className="text-6xl mb-4">⏳</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Uploading... {Math.round(uploadProgress)}%
                </h3>
                <div className="max-w-md mx-auto mt-4">
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">or click anywhere in this box to browse</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                  }}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition font-medium"
                >
                  Browse Files
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Supports: PDF, DOCX, JPG, PNG, MP3, MP4, and 20+ more formats
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to determine default output format
function getDefaultOutputFormat(inputFormat: string): string {
  const formatMap: Record<string, string> = {
    // Documents
    docx: 'pdf',
    doc: 'pdf',
    xlsx: 'pdf',
    xls: 'pdf',
    pptx: 'pdf',
    ppt: 'pdf',
    txt: 'pdf',
    
    // Images
    jpg: 'png',
    jpeg: 'png',
    png: 'jpg',
    heic: 'jpg',
    webp: 'png',
    gif: 'png',
    
    // Audio
    wav: 'mp3',
    flac: 'mp3',
    aac: 'mp3',
    ogg: 'mp3',
    
    // Video
    mov: 'mp4',
    avi: 'mp4',
    mkv: 'mp4',
    webm: 'mp4',
  };

  return formatMap[inputFormat] || 'pdf';
}
