// src/services/media.service.ts
import { cloudinary } from '../config/cloudinary.config';  // Import from config, not from package
import logger from '../utils/logger';

interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

class MediaService {
  /**
   * Upload image buffer to Cloudinary
   */
  async uploadImage(
    buffer: Buffer,
    folder: string,
    publicId?: string
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId || `img_${Date.now()}`,
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            logger.error('Cloudinary upload error:', error);
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
            });
          }
        }
      );

      // Convert buffer to stream and pipe to Cloudinary
      const { Readable } = require('stream');
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  /**
   * Upload from file path
   */
  async uploadFromPath(
    filePath: string,
    folder: string,
    publicId?: string
  ): Promise<UploadResult> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        public_id: publicId || `img_${Date.now()}`,
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      logger.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info(`Deleted image from Cloudinary: ${publicId}`);
    } catch (error) {
      logger.error('Cloudinary delete error:', error);
      throw error;
    }
  }

  /**
   * Get optimized URL for an image
   */
  getOptimizedUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    crop?: string;
  }): string {
    return cloudinary.url(publicId, {
      secure: true,
      transformation: [
        {
          width: options?.width || 400,
          height: options?.height || 400,
          crop: options?.crop || 'fill',
          gravity: 'face',
        },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });
  }
}

export const mediaService = new MediaService();