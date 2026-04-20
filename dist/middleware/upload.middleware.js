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
        fileSize: 10 * 1024 * 1024,
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
/**
 * Uploads the multer-processed file to Cloudinary.
 * Images are routed through `mediaService` for optimisation; audio and video are
 * uploaded as raw/video resources respectively. Attaches the result as
 * `req.cloudinaryResult` and removes the local temp file.
 */
const uploadToCloudinary = async (req, res, next) => {
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
        req.cloudinaryResult = result;
        if (fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Cloudinary upload error:', error);
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        next(error);
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
/**
 * Sets `req.uploadType` so downstream storage middleware can route files to
 * the correct subdirectory (e.g. "profiles", "videos").
 */
const setUploadType = (type) => {
    return (req, res, next) => {
        req.uploadType = type;
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
        }
    });
};
ensureUploadDirs();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadType = req.uploadType || 'temp';
        const dir = path_1.default.join(process.cwd(), 'public', 'uploads', uploadType);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
const fileFilter = (req, file, cb) => {
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
/**
 * Computes a perceptual hash of the uploaded image and rejects it with 409
 * if an identical image from a different user already exists. Same-user
 * re-uploads are always permitted. Attaches `req.mediaHash` for later storage.
 */
const checkImageDuplicate = async (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        }
        if (!req.file.mimetype.startsWith('image/')) {
            return next();
        }
        const userId = req.user?.userId;
        const fileBuffer = fs_1.default.readFileSync(req.file.path);
        const result = await duplicateDetection_service_1.default.checkDuplicate(userId, fileBuffer, 'image');
        req.mediaHash = result.hash;
        if (result.isSameUser) {
            return next();
        }
        if (result.isDuplicate) {
            if (fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            res.status(409).json({
                success: false,
                message: 'This image appears to be a duplicate',
                similarity: result.similarity,
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Duplicate check error:', error);
        // Do not block the upload on a hash check failure
        next();
    }
};
exports.checkImageDuplicate = checkImageDuplicate;
/**
 * Same as `checkImageDuplicate` but for video files. Returns 409 on detection
 * and cleans up the local temp file before responding.
 */
const checkVideoDuplicate = async (req, res, next) => {
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
        const fileBuffer = fs_1.default.readFileSync(req.file.path);
        const duplicateCheck = await duplicateDetection_service_1.default.checkDuplicate(userId, fileBuffer, 'video', req.file.path);
        if (duplicateCheck.isDuplicate) {
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
/**
 * Resizes images to a maximum of 1920x1920 and re-encodes them as
 * progressive JPEG at 85% quality. The original temp file is replaced
 * with the optimised output in-place.
 */
const processImage = async (req, res, next) => {
    try {
        if (!req.file || !req.file.mimetype.startsWith('image/')) {
            return next();
        }
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
        if (fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        req.file.path = outputPath;
        req.file.filename = path_1.default.basename(outputPath);
        next();
    }
    catch (error) {
        logger_1.default.error('Error processing image:', error);
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
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