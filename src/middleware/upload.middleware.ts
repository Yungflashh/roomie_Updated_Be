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
import { mediaService } from '../services/media.service'

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024;


;
;

// Temporary local storage (files will be uploaded to Cloudinary after processing)
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
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Upload to Cloudinary middleware
export const uploadToCloudinary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return next();
    }

    const userId = req.user?.userId;
    const folder = `roomie/users/${userId}`;

    logger.info(`Uploading to Cloudinary for user: ${userId}`);

    const result = await mediaService.uploadFromPath(
      req.file.path,
      folder,
      `${Date.now()}_${req.file.originalname.split('.')[0]}`
    );

    // Attach Cloudinary result to request
    (req as any).cloudinaryResult = result;

    // Delete temp file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    logger.info(`Uploaded to Cloudinary: ${result.url}`);
    next();
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    next(error);
  }
};

// Set upload type (for folder organization)
export const setUploadType = (type: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    (req as any).uploadType = type;
    logger.info(`setUploadType called with type: ${type}`);
    next();
  };
};


const ensureUploadDirs = () => {
  const dirs = ['profiles', 'temp', 'videos'];
  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), 'public', 'uploads', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logger.info(`Created directory: ${fullPath}`);
    }
  });
};

// Initialize directories
ensureUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = (req as any).uploadType || 'temp';
    const dir = path.join(process.cwd(), 'public', 'uploads', uploadType);
    
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    logger.info(`Upload destination: ${dir}`);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    logger.info(`Generated filename: ${uniqueName}`);
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  logger.info(`File filter - mimetype: ${file.mimetype}, originalname: ${file.originalname}`);
  
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





export const checkImageDuplicate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return next();
    }

    logger.info('checkImageDuplicate middleware called');
    logger.info(`File received: ${req.file.filename}`);

    const userId = req.user?.userId;
    const fileBuffer = fs.readFileSync(req.file.path);

    logger.info(`Checking duplicate for user: ${userId}, type: image`);

    const result = await duplicateDetectionService.checkDuplicate(
      userId!,
      fileBuffer,
      'image'
    );

    // Store hash for later saving
    (req as any).mediaHash = result.hash;

    // If same user re-uploading, allow it
    if (result.isSameUser) {
      logger.info('Same user re-uploading their own image - allowing');
      return next();
    }

    // If duplicate from different user, reject
    if (result.isDuplicate) {
      logger.warn(`Duplicate detected from different user: ${JSON.stringify(result.existingFile)}`);
      
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(409).json({
        success: false,
        message: 'This image appears to be a duplicate',
        similarity: result.similarity,
      });
    }

    logger.info('No duplicate found, proceeding...');
    next();
  } catch (error) {
    logger.error('Duplicate check error:', error);
    // Don't block upload on duplicate check errors
    next();
  }
};
// Middleware to check for duplicate videos
export const checkVideoDuplicate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('checkVideoDuplicate middleware called');
    
    if (!req.file) {
      logger.info('No file found in request, skipping duplicate check');
      return next();
    }

    const userId = req.user?.userId;
    if (!userId) {
      logger.error('User not authenticated');
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const fileBuffer = fs.readFileSync(req.file.path);

    logger.info(`Checking video duplicate for user: ${userId}`);

    const duplicateCheck = await duplicateDetectionService.checkDuplicate(
      userId,
      fileBuffer,
      'video',
      req.file.path
    );

    if (duplicateCheck.isDuplicate) {
      logger.warn(`Duplicate video detected: ${duplicateCheck.existingFile}`);
      
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

    logger.info('No duplicate video found, proceeding...');
    
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

// Process and optimize images
export const processImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('processImage middleware called');
    
    if (!req.file) {
      logger.info('No file found in request, skipping image processing');
      return next();
    }

    // Skip if not an image
    if (!req.file.mimetype.startsWith('image/')) {
      logger.info('File is not an image, skipping processing');
      return next();
    }

    logger.info(`Processing image: ${req.file.filename}`);

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

    logger.info(`Image optimized: ${outputPath}`);

    // Delete original and use optimized
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    req.file.path = outputPath;
    req.file.filename = path.basename(outputPath);

    logger.info('Image processing complete');
    next();
  } catch (error) {
    logger.error('Error processing image:', error);
    
    // Clean up files on error
    if (req.file) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error processing image',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
