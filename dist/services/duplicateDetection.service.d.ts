interface HashResult {
    phash?: string;
    blockhash?: string;
    md5: string;
}
interface DuplicateCheckResult {
    isDuplicate: boolean;
    isSameUser?: boolean;
    similarity?: number;
    existingFile?: {
        _id: string;
        fileUrl: string;
        uploadedAt: Date;
    };
    hash: HashResult;
}
declare class DuplicateDetectionService {
    private readonly SIMILARITY_THRESHOLD;
    private readonly CACHE_TTL;
    /**
     * Calculate MD5 hash of file buffer
     */
    private calculateMD5;
    /**
     * Calculate perceptual hash using blockhash algorithm
     */
    private calculatePerceptualHash;
    /**
     * Calculate Hamming distance between two hashes
     */
    private hammingDistance;
    /**
     * Calculate similarity percentage between two hashes
     */
    private calculateSimilarity;
    /**
     * Generate all hashes for an image
     */
    generateImageHashes(buffer: Buffer): Promise<HashResult>;
    /**
     * Generate hashes for a video (using frame sampling)
     */
    generateVideoHashes(filePath: string): Promise<HashResult>;
    /**
     * Check if media is duplicate
     * Now allows same user to re-upload their own images
     */
    checkDuplicate(userId: string, fileBuffer: Buffer, fileType: 'image' | 'video', filePath?: string): Promise<DuplicateCheckResult>;
    /**
     * Save media hash to database
     */
    saveMediaHash(userId: string, originalFilename: string, fileUrl: string, fileType: 'image' | 'video', hashes: HashResult, dimensions?: {
        width: number;
        height: number;
    }, size?: number): Promise<void>;
    /**
     * Delete media hash when image is deleted
     */
    deleteMediaHash(userId: string, fileUrl: string): Promise<void>;
    /**
     * Clear duplicate cache
     */
    clearCache(md5Hash: string): Promise<void>;
}
declare const _default: DuplicateDetectionService;
export default _default;
//# sourceMappingURL=duplicateDetection.service.d.ts.map