import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const upload: multer.Multer;
/**
 * Uploads the multer-processed file to Cloudinary.
 * Images are routed through `mediaService` for optimisation; audio and video are
 * uploaded as raw/video resources respectively. Attaches the result as
 * `req.cloudinaryResult` and removes the local temp file.
 */
export declare const uploadToCloudinary: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Sets `req.uploadType` so downstream storage middleware can route files to
 * the correct subdirectory (e.g. "profiles", "videos").
 */
export declare const setUploadType: (type: string) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Computes a perceptual hash of the uploaded image and rejects it with 409
 * if an identical image from a different user already exists. Same-user
 * re-uploads are always permitted. Attaches `req.mediaHash` for later storage.
 */
export declare const checkImageDuplicate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Same as `checkImageDuplicate` but for video files. Returns 409 on detection
 * and cleans up the local temp file before responding.
 */
export declare const checkVideoDuplicate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Resizes images to a maximum of 1920x1920 and re-encodes them as
 * progressive JPEG at 85% quality. The original temp file is replaced
 * with the optimised output in-place.
 */
export declare const processImage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=upload.middleware.d.ts.map