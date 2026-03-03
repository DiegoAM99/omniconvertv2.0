import sharp, { FormatEnum } from 'sharp';
import { ImageFormat } from '@omniconvert/types';
import { logger } from '../config/logger';

export interface ImageConversionOptions {
  quality?: number; // 1-100
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  compressionLevel?: number; // 0-9 for PNG
}

export class ImageProcessor {
  // Map our ImageFormat to Sharp format keys
  private static formatMap: Record<ImageFormat, keyof FormatEnum> = {
    [ImageFormat.JPG]: 'jpeg',
    [ImageFormat.JPEG]: 'jpeg',
    [ImageFormat.PNG]: 'png',
    [ImageFormat.WEBP]: 'webp',
    [ImageFormat.GIF]: 'gif',
    [ImageFormat.SVG]: 'svg',
    [ImageFormat.HEIC]: 'heif',
    [ImageFormat.TIFF]: 'tiff',
  };

  static async convert(
    inputBuffer: Buffer,
    inputFormat: ImageFormat,
    outputFormat: ImageFormat,
    options: ImageConversionOptions = {}
  ): Promise<Buffer> {
    try {
      logger.info(`Converting image from ${inputFormat} to ${outputFormat}`);

      let pipeline = sharp(inputBuffer);

      // Apply resizing if specified
      if (options.width || options.height) {
        pipeline = pipeline.resize(options.width, options.height, {
          fit: options.fit || 'inside',
          withoutEnlargement: true,
        });
      }

      // Get Sharp format key
      const sharpFormat = this.formatMap[outputFormat];

      // Apply format-specific options
      switch (outputFormat) {
        case ImageFormat.JPG:
        case ImageFormat.JPEG:
          pipeline = pipeline.jpeg({
            quality: options.quality || 85,
            progressive: true,
            mozjpeg: true,
          });
          break;

        case ImageFormat.PNG:
          pipeline = pipeline.png({
            quality: options.quality || 90,
            compressionLevel: options.compressionLevel || 6,
            progressive: true,
          });
          break;

        case ImageFormat.WEBP:
          pipeline = pipeline.webp({
            quality: options.quality || 85,
            effort: 4,
          });
          break;

        case ImageFormat.GIF:
          pipeline = pipeline.gif({
            effort: options.compressionLevel || 7,
          });
          break;

        case ImageFormat.TIFF:
          pipeline = pipeline.tiff({
            quality: options.quality || 90,
            compression: 'lzw',
          });
          break;

        case ImageFormat.HEIC:
          pipeline = pipeline.heif({
            quality: options.quality || 85,
            compression: 'hevc',
          });
          break;

        case ImageFormat.SVG:
          // SVG is special - if input is SVG, just return it
          // If input is raster, we can't convert to SVG
          if (inputFormat === ImageFormat.SVG) {
            return inputBuffer;
          }
          throw new Error('Cannot convert raster image to SVG');

        default:
          pipeline = pipeline.toFormat(sharpFormat);
      }

      const outputBuffer = await pipeline.toBuffer();
      logger.info(`Image conversion completed. Output size: ${outputBuffer.length} bytes`);

      return outputBuffer;
    } catch (error: any) {
      logger.error('Image conversion failed:', error);
      throw new Error(`Image conversion failed: ${error.message}`);
    }
  }

  // Get image metadata
  static async getMetadata(buffer: Buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space,
        channels: metadata.channels,
        depth: metadata.depth,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation,
      };
    } catch (error: any) {
      logger.error('Failed to get image metadata:', error);
      throw new Error(`Failed to get image metadata: ${error.message}`);
    }
  }
}
