import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const upload: multer.Multer;
export declare const checkImageDuplicate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkVideoDuplicate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const processImage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const setUploadType: (type: string) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=upload.middleware.d.ts.map