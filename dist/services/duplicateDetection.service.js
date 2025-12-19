"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// services/duplicateDetection.service.ts
const sharp_1 = __importDefault(require("sharp"));
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("../models");
const redis_1 = __importDefault(require("../config/redis"));
const logger_1 = __importDefault(require("../utils/logger"));
const fs_1 = __importDefault(require("fs"));
// Blockhash implementation
const blockhash = require('blockhash-core');
const { imageFromBuffer, bmvbhashEven } = blockhash;
class DuplicateDetectionService {
    SIMILARITY_THRESHOLD = 0.90; // 90% similarity threshold
    CACHE_TTL = 86400; // 24 hours
    /**
     * Calculate MD5 hash of file buffer
     */
    calculateMD5(buffer) {
        return crypto_1.default.createHash('md5').update(buffer).digest('hex');
    }
    /**
     * Calculate perceptual hash using blockhash algorithm
     */
    async calculatePerceptualHash(buffer) {
        try {
            // Resize image to 16x16 and convert to grayscale
            const resized = await (0, sharp_1.default)(buffer)
                .resize(16, 16, { fit: 'fill' })
                .grayscale()
                .raw()
                .toBuffer({ resolveWithObject: true });
            // Create image data for blockhash
            const imgData = {
                width: resized.info.width,
                height: resized.info.height,
                data: new Uint8Array(resized.data),
            };
            // Calculate blockhash
            const hash = bmvbhashEven(imgData, 16);
            return hash.toString('hex');
        }
        catch (error) {
            logger_1.default.error('Error calculating perceptual hash:', error);
            return '';
        }
    }
    /**
     * Calculate Hamming distance between two hashes
     */
    hammingDistance(hash1, hash2) {
        if (hash1.length !== hash2.length)
            return Infinity;
        let distance = 0;
        for (let i = 0; i < hash1.length; i++) {
            if (hash1[i] !== hash2[i])
                distance++;
        }
        return distance;
    }
    /**
     * Calculate similarity percentage between two hashes
     */
    calculateSimilarity(hash1, hash2) {
        const distance = this.hammingDistance(hash1, hash2);
        const maxDistance = hash1.length;
        return 1 - (distance / maxDistance);
    }
    /**
     * Generate all hashes for an image
     */
    async generateImageHashes(buffer) {
        const md5 = this.calculateMD5(buffer);
        const phash = await this.calculatePerceptualHash(buffer);
        const blockhash = await this.calculatePerceptualHash(buffer);
        return {
            md5,
            phash,
            blockhash,
        };
    }
    /**
     * Generate hashes for a video (using frame sampling)
     */
    async generateVideoHashes(filePath) {
        const fileBuffer = fs_1.default.readFileSync(filePath);
        const md5 = this.calculateMD5(fileBuffer);
        return {
            md5,
        };
    }
    /**
     * Check if media is duplicate
     * Now allows same user to re-upload their own images
     */
    async checkDuplicate(userId, fileBuffer, fileType, filePath) {
        try {
            // Generate hashes
            const hashes = fileType === 'image'
                ? await this.generateImageHashes(fileBuffer)
                : await this.generateVideoHashes(filePath);
            // Check Redis cache first
            const cacheKey = `duplicate:${hashes.md5}`;
            const cached = await redis_1.default.get(cacheKey);
            if (cached) {
                const cachedData = JSON.parse(cached);
                // Check if it's the same user - allow re-upload
                if (cachedData.userId === userId) {
                    logger_1.default.info(`Same user (${userId}) re-uploading - allowing`);
                    return {
                        isDuplicate: false,
                        isSameUser: true,
                        hash: hashes,
                    };
                }
                return {
                    isDuplicate: true,
                    isSameUser: false,
                    similarity: 100,
                    existingFile: cachedData,
                    hash: hashes,
                };
            }
            // Check MD5 exact match in database
            const exactMatch = await models_1.MediaHash.findOne({
                'hashes.md5': hashes.md5,
            });
            if (exactMatch) {
                const isSameUser = exactMatch.user.toString() === userId;
                // If same user, allow re-upload
                if (isSameUser) {
                    logger_1.default.info(`Same user (${userId}) re-uploading existing image - allowing`);
                    return {
                        isDuplicate: false,
                        isSameUser: true,
                        hash: hashes,
                    };
                }
                // Different user - cache and reject
                await redis_1.default.setex(cacheKey, this.CACHE_TTL, JSON.stringify({
                    _id: exactMatch._id,
                    fileUrl: exactMatch.fileUrl,
                    uploadedAt: exactMatch.uploadedAt,
                    userId: exactMatch.user.toString(),
                }));
                return {
                    isDuplicate: true,
                    isSameUser: false,
                    similarity: 100,
                    existingFile: {
                        _id: exactMatch._id.toString(),
                        fileUrl: exactMatch.fileUrl,
                        uploadedAt: exactMatch.uploadedAt,
                    },
                    hash: hashes,
                };
            }
            // For images, check perceptual hashes for similar images
            if (fileType === 'image' && hashes.phash) {
                const allHashes = await models_1.MediaHash.find({
                    fileType: 'image',
                    'hashes.phash': { $exists: true },
                }).select('hashes fileUrl uploadedAt user');
                for (const media of allHashes) {
                    if (media.hashes.phash) {
                        const similarity = this.calculateSimilarity(hashes.phash, media.hashes.phash);
                        if (similarity >= this.SIMILARITY_THRESHOLD) {
                            const isSameUser = media.user.toString() === userId;
                            // If same user, allow re-upload
                            if (isSameUser) {
                                logger_1.default.info(`Same user (${userId}) re-uploading similar image - allowing`);
                                return {
                                    isDuplicate: false,
                                    isSameUser: true,
                                    hash: hashes,
                                };
                            }
                            return {
                                isDuplicate: true,
                                isSameUser: false,
                                similarity: similarity * 100,
                                existingFile: {
                                    _id: media._id.toString(),
                                    fileUrl: media.fileUrl,
                                    uploadedAt: media.uploadedAt,
                                },
                                hash: hashes,
                            };
                        }
                    }
                }
            }
            // Not a duplicate
            return {
                isDuplicate: false,
                hash: hashes,
            };
        }
        catch (error) {
            logger_1.default.error('Error checking duplicate:', error);
            throw error;
        }
    }
    /**
     * Save media hash to database
     */
    async saveMediaHash(userId, originalFilename, fileUrl, fileType, hashes, dimensions, size) {
        try {
            // Check if this hash already exists for this user - update instead of create
            const existingHash = await models_1.MediaHash.findOne({
                user: userId,
                'hashes.md5': hashes.md5,
            });
            if (existingHash) {
                // Update existing record
                await models_1.MediaHash.findByIdAndUpdate(existingHash._id, {
                    originalFilename,
                    fileUrl,
                    uploadedAt: new Date(),
                });
                logger_1.default.info(`Media hash updated for user ${userId}: ${hashes.md5}`);
            }
            else {
                // Create new record
                await models_1.MediaHash.create({
                    user: userId,
                    originalFilename,
                    fileUrl,
                    fileType,
                    hashes,
                    dimensions,
                    size: size || 0,
                    uploadedAt: new Date(),
                });
                logger_1.default.info(`Media hash saved for user ${userId}: ${hashes.md5}`);
            }
            // Cache the hash
            const cacheKey = `duplicate:${hashes.md5}`;
            await redis_1.default.setex(cacheKey, this.CACHE_TTL, JSON.stringify({
                fileUrl,
                uploadedAt: new Date(),
                userId,
            }));
        }
        catch (error) {
            logger_1.default.error('Error saving media hash:', error);
            throw error;
        }
    }
    /**
     * Delete media hash when image is deleted
     */
    async deleteMediaHash(userId, fileUrl) {
        try {
            const mediaHash = await models_1.MediaHash.findOneAndDelete({
                user: userId,
                fileUrl,
            });
            if (mediaHash) {
                // Clear cache
                const cacheKey = `duplicate:${mediaHash.hashes.md5}`;
                await redis_1.default.del(cacheKey);
                logger_1.default.info(`Media hash deleted for user ${userId}: ${fileUrl}`);
            }
        }
        catch (error) {
            logger_1.default.error('Error deleting media hash:', error);
        }
    }
    /**
     * Clear duplicate cache
     */
    async clearCache(md5Hash) {
        const cacheKey = `duplicate:${md5Hash}`;
        await redis_1.default.del(cacheKey);
    }
}
exports.default = new DuplicateDetectionService();
//# sourceMappingURL=duplicateDetection.service.js.map