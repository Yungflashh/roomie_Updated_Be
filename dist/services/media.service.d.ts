interface UploadResult {
    url: string;
    publicId: string;
    width: number;
    height: number;
}
declare class MediaService {
    /**
     * Upload image buffer to Cloudinary
     */
    uploadImage(buffer: Buffer, folder: string, publicId?: string): Promise<UploadResult>;
    /**
     * Upload from file path
     */
    uploadFromPath(filePath: string, folder: string, publicId?: string): Promise<UploadResult>;
    /**
     * Delete image from Cloudinary
     */
    deleteImage(publicId: string): Promise<void>;
    /**
     * Get optimized URL for an image
     */
    getOptimizedUrl(publicId: string, options?: {
        width?: number;
        height?: number;
        crop?: string;
    }): string;
}
export declare const mediaService: MediaService;
export {};
//# sourceMappingURL=media.service.d.ts.map