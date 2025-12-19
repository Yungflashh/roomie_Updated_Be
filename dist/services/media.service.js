"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaService = void 0;
// src/services/media.service.ts
const cloudinary_config_1 = require("../config/cloudinary.config"); // Import from config, not from package
const logger_1 = __importDefault(require("../utils/logger"));
class MediaService {
    /**
     * Upload image buffer to Cloudinary
     */
    async uploadImage(buffer, folder, publicId) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_config_1.cloudinary.uploader.upload_stream({
                folder,
                public_id: publicId || `img_${Date.now()}`,
                transformation: [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' },
                ],
            }, (error, result) => {
                if (error) {
                    logger_1.default.error('Cloudinary upload error:', error);
                    reject(error);
                }
                else if (result) {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        width: result.width,
                        height: result.height,
                    });
                }
            });
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
    async uploadFromPath(filePath, folder, publicId) {
        try {
            const result = await cloudinary_config_1.cloudinary.uploader.upload(filePath, {
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
        }
        catch (error) {
            logger_1.default.error('Cloudinary upload error:', error);
            throw error;
        }
    }
    /**
     * Delete image from Cloudinary
     */
    async deleteImage(publicId) {
        try {
            await cloudinary_config_1.cloudinary.uploader.destroy(publicId);
            logger_1.default.info(`Deleted image from Cloudinary: ${publicId}`);
        }
        catch (error) {
            logger_1.default.error('Cloudinary delete error:', error);
            throw error;
        }
    }
    /**
     * Get optimized URL for an image
     */
    getOptimizedUrl(publicId, options) {
        return cloudinary_config_1.cloudinary.url(publicId, {
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
exports.mediaService = new MediaService();
//# sourceMappingURL=media.service.js.map