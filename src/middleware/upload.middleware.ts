import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import duplicateDetectionService from '../services/duplicateDetection.service';
import { AuthRequest } from '../types';
import logger from '../utils/logger';
import fs from 'fs';
import { MediaHash } from '../models';
import { cloudinary } from '../config/cloudinary.config';
import { mediaService } from '../services/media.service';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024;

const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage: tempStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image, audio, and video files are allowed'));
    }
  },
});

/**
 * Uploads the multer-processed file to Cloudinary.
 * Images are routed through `mediaService` for optimisation; audio and video are
 * uploaded as raw/video resources respectively. Attaches the result as
 * `req.cloudinaryResult` and removes the local temp file.
 */
export const uploadToCloudinary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      return next();
    }

    const userId = req.user?.userId;
    const isAudio = req.file.mimetype.startsWith('audio/');
    const isVideo = req.file.mimetype.startsWith('video/');
    const folder = `roomie/users/${userId}${isAudio ? '/audio' : isVideo ? '/video' : ''}`;

    let result;
    if (isAudio || isVideo) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder,
        resource_type: isVideo ? 'video' : 'raw',
        public_id: `${Date.now()}_${req.file.originalname.split('.')[0]}`,
      });
      result = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: 0,
        height: 0,
      };
    } else {
      result = await mediaService.uploadFromPath(
        req.file.path,
        folder,
        `${Date.now()}_${req.file.originalname.split('.')[0]}`
      );
    }

    (req as any).cloudinaryResult = result;

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    next();
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * Sets `req.uploadType` so downstream storage middleware can route files to
 * the correct subdirectory (e.g. "profiles", "videos").
 */
export const setUploadType = (type: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    (req as any).uploadType = type;
    next();
  };
};

const ensureUploadDirs = () => {
  const dirs = ['profiles', 'temp', 'videos'];
  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), 'public', 'uploads', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

ensureUploadDirs();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = (req as any).uploadType || 'temp';
    const dir = path.join(process.cwd(), 'public', 'uploads', uploadType);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, WEBP, and MP4 videos are allowed.`));
  }
};

/**
 * Computes a perceptual hash of the uploaded image and rejects it with 409
 * if an identical image from a different user already exists. Same-user
 * re-uploads are always permitted. Attaches `req.mediaHash` for later storage.
 */
export const checkImageDuplicate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      return next();
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return next();
    }

    const userId = req.user?.userId;
    const fileBuffer = fs.readFileSync(req.file.path);

    const result = await duplicateDetectionService.checkDuplicate(
      userId!,
      fileBuffer,
      'image'
    );

    (req as any).mediaHash = result.hash;

    if (result.isSameUser) {
      return next();
    }

    if (result.isDuplicate) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(409).json({
        success: false,
        message: 'This image appears to be a duplicate',
        similarity: result.similarity,
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Duplicate check error:', error);
    // Do not block the upload on a hash check failure
    next();
  }
};

/**
 * Same as `checkImageDuplicate` but for video files. Returns 409 on detection
 * and cleans up the local temp file before responding.
 */
export const checkVideoDuplicate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      return next();
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const fileBuffer = fs.readFileSync(req.file.path);

    const duplicateCheck = await duplicateDetectionService.checkDuplicate(
      userId,
      fileBuffer,
      'video',
      req.file.path
    );

    if (duplicateCheck.isDuplicate) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(409).json({
        success: false,
        message: 'Duplicate video detected',
        similarity: duplicateCheck.similarity,
        existingFile: duplicateCheck.existingFile,
      });
      return;
    }

    (req as any).mediaHash = duplicateCheck.hash;
    next();
  } catch (error) {
    logger.error('Error checking video duplicate:', error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error processing upload',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Resizes images to a maximum of 1920x1920 and re-encodes them as
 * progressive JPEG at 85% quality. The original temp file is replaced
 * with the optimised output in-place.
 */
export const processImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file || !req.file.mimetype.startsWith('image/')) {
      return next();
    }

    const outputPath = req.file.path.replace(path.extname(req.file.path), '_optimized.jpg');

    await sharp(req.file.path)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toFile(outputPath);

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    req.file.path = outputPath;
    req.file.filename = path.basename(outputPath);

    next();
  } catch (error) {
    logger.error('Error processing image:', error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error processing image',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
