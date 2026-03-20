"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = exports.checkVideoDuplicate = exports.checkImageDuplicate = exports.setUploadType = exports.uploadToCloudinary = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const sharp_1 = __importDefault(require("sharp"));
const duplicateDetection_service_1 = __importDefault(require("../services/duplicateDetection.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const fs_1 = __importDefault(require("fs"));
const cloudinary_config_1 = require("../config/cloudinary.config");
const media_service_1 = require("../services/media.service");
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024;
;
;
// Temporary local storage (files will be uploaded to Cloudinary after processing)
const tempStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path_1.default.join(__dirname, '../../temp');
        if (!fs_1.default.existsSync(tempDir)) {
            fs_1.default.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
exports.upload = (0, multer_1.default)({
    storage: tempStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image, audio, and video files are allowed'));
        }
    },
});
// Upload to Cloudinary middleware
const uploadToCloudinary = async (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        }
        const userId = req.user?.userId;
        const isAudio = req.file.mimetype.startsWith('audio/');
        const isVideo = req.file.mimetype.startsWith('video/');
        const folder = `roomie/users/${userId}${isAudio ? '/audio' : isVideo ? '/video' : ''}`;
        logger_1.default.info(`Uploading to Cloudinary for user: ${userId}, type: ${req.file.mimetype}`);
        let result;
        if (isAudio || isVideo) {
            // Upload audio/video as raw resource (no image transformations)
            const uploadResult = await cloudinary_config_1.cloudinary.uploader.upload(req.file.path, {
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
        }
        else {
            result = await media_service_1.mediaService.uploadFromPath(req.file.path, folder, `${Date.now()}_${req.file.originalname.split('.')[0]}`);
        }
        // Attach Cloudinary result to request
        req.cloudinaryResult = result;
        // Delete temp file
        if (fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        logger_1.default.info(`Uploaded to Cloudinary: ${result.url}`);
        next();
    }
    catch (error) {
        logger_1.default.error('Cloudinary upload error:', error);
        // Clean up temp file on error
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        next(error);
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
// Set upload type (for folder organization)
const setUploadType = (type) => {
    return (req, res, next) => {
        req.uploadType = type;
        logger_1.default.info(`setUploadType called with type: ${type}`);
        next();
    };
};
exports.setUploadType = setUploadType;
const ensureUploadDirs = () => {
    const dirs = ['profiles', 'temp', 'videos'];
    dirs.forEach(dir => {
        const fullPath = path_1.default.join(process.cwd(), 'public', 'uploads', dir);
        if (!fs_1.default.existsSync(fullPath)) {
            fs_1.default.mkdirSync(fullPath, { recursive: true });
            logger_1.default.info(`Created directory: ${fullPath}`);
        }
    });
};
// Initialize directories
ensureUploadDirs();
// Storage configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadType = req.uploadType || 'temp';
        const dir = path_1.default.join(process.cwd(), 'public', 'uploads', uploadType);
        // Ensure directory exists
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        logger_1.default.info(`Upload destination: ${dir}`);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
        logger_1.default.info(`Generated filename: ${uniqueName}`);
        cb(null, uniqueName);
    },
});
// File filter
const fileFilter = (req, file, cb) => {
    logger_1.default.info(`File filter - mimetype: ${file.mimetype}, originalname: ${file.originalname}`);
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
    }
    else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, WEBP, and MP4 videos are allowed.`));
    }
};
const checkImageDuplicate = async (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        }
        // Skip duplicate check for non-image files (audio, video)
        if (!req.file.mimetype.startsWith('image/')) {
            return next();
        }
        logger_1.default.info('checkImageDuplicate middleware called');
        logger_1.default.info(`File received: ${req.file.filename}`);
        const userId = req.user?.userId;
        const fileBuffer = fs_1.default.readFileSync(req.file.path);
        logger_1.default.info(`Checking duplicate for user: ${userId}, type: image`);
        const result = await duplicateDetection_service_1.default.checkDuplicate(userId, fileBuffer, 'image');
        // Store hash for later saving
        req.mediaHash = result.hash;
        // If same user re-uploading, allow it
        if (result.isSameUser) {
            logger_1.default.info('Same user re-uploading their own image - allowing');
            return next();
        }
        // If duplicate from different user, reject
        if (result.isDuplicate) {
            logger_1.default.warn(`Duplicate detected from different user: ${JSON.stringify(result.existingFile)}`);
            // Clean up uploaded file
            if (fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            return res.status(409).json({
                success: false,
                message: 'This image appears to be a duplicate',
                similarity: result.similarity,
            });
        }
        logger_1.default.info('No duplicate found, proceeding...');
        next();
    }
    catch (error) {
        logger_1.default.error('Duplicate check error:', error);
        // Don't block upload on duplicate check errors
        next();
    }
};
exports.checkImageDuplicate = checkImageDuplicate;
// Middleware to check for duplicate videos
const checkVideoDuplicate = async (req, res, next) => {
    try {
        logger_1.default.info('checkVideoDuplicate middleware called');
        if (!req.file) {
            logger_1.default.info('No file found in request, skipping duplicate check');
            return next();
        }
        const userId = req.user?.userId;
        if (!userId) {
            logger_1.default.error('User not authenticated');
            res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
            return;
        }
        const fileBuffer = fs_1.default.readFileSync(req.file.path);
        logger_1.default.info(`Checking video duplicate for user: ${userId}`);
        const duplicateCheck = await duplicateDetection_service_1.default.checkDuplicate(userId, fileBuffer, 'video', req.file.path);
        if (duplicateCheck.isDuplicate) {
            logger_1.default.warn(`Duplicate video detected: ${duplicateCheck.existingFile}`);
            if (fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            res.status(409).json({
                success: false,
                message: 'Duplicate video detected',
                similarity: duplicateCheck.similarity,
                existingFile: duplicateCheck.existingFile,
            });
            return;
        }
        logger_1.default.info('No duplicate video found, proceeding...');
        req.mediaHash = duplicateCheck.hash;
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking video duplicate:', error);
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: 'Error processing upload',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.checkVideoDuplicate = checkVideoDuplicate;
// Process and optimize images
const processImage = async (req, res, next) => {
    try {
        logger_1.default.info('processImage middleware called');
        if (!req.file) {
            logger_1.default.info('No file found in request, skipping image processing');
            return next();
        }
        // Skip if not an image
        if (!req.file.mimetype.startsWith('image/')) {
            logger_1.default.info('File is not an image, skipping processing');
            return next();
        }
        logger_1.default.info(`Processing image: ${req.file.filename}`);
        const outputPath = req.file.path.replace(path_1.default.extname(req.file.path), '_optimized.jpg');
        await (0, sharp_1.default)(req.file.path)
            .resize(1920, 1920, {
            fit: 'inside',
            withoutEnlargement: true,
        })
            .jpeg({
            quality: 85,
            progressive: true,
        })
            .toFile(outputPath);
        logger_1.default.info(`Image optimized: ${outputPath}`);
        // Delete original and use optimized
        if (fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        req.file.path = outputPath;
        req.file.filename = path_1.default.basename(outputPath);
        logger_1.default.info('Image processing complete');
        next();
    }
    catch (error) {
        logger_1.default.error('Error processing image:', error);
        // Clean up files on error
        if (req.file) {
            if (fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
        }
        res.status(500).json({
            success: false,
            message: 'Error processing image',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.processImage = processImage;
//# sourceMappingURL=upload.middleware.js.map