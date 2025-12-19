"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUploadType = exports.processImage = exports.checkVideoDuplicate = exports.checkImageDuplicate = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const sharp_1 = __importDefault(require("sharp"));
const duplicateDetection_service_1 = __importDefault(require("../services/duplicateDetection.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const fs_1 = __importDefault(require("fs"));
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024;
// Storage configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadType = req.uploadType || 'temp';
        const dir = path_1.default.join(process.cwd(), 'public', 'uploads', uploadType);
        // Ensure directory exists
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
// File filter
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
        cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and MP4 videos are allowed.'));
    }
};
// Multer instance
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});
// Middleware to check for duplicate images
const checkImageDuplicate = async (req, res, next) => {
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
        const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
        // Check for duplicate
        const duplicateCheck = await duplicateDetection_service_1.default.checkDuplicate(userId, fileBuffer, fileType, req.file.path);
        if (duplicateCheck.isDuplicate) {
            // Delete the uploaded file
            fs_1.default.unlinkSync(req.file.path);
            res.status(409).json({
                success: false,
                message: 'Duplicate media detected',
                similarity: duplicateCheck.similarity,
                existingFile: duplicateCheck.existingFile,
            });
            return;
        }
        // Store hash info in request for later use
        req.mediaHash = duplicateCheck.hash;
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking duplicate:', error);
        // Clean up file on error
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: 'Error processing upload',
        });
    }
};
exports.checkImageDuplicate = checkImageDuplicate;
// Middleware to check for duplicate videos
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
            fs_1.default.unlinkSync(req.file.path);
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
        });
    }
};
exports.checkVideoDuplicate = checkVideoDuplicate;
// Process and optimize images
const processImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        }
        // Skip if not an image
        if (!req.file.mimetype.startsWith('image/')) {
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
        // Delete original and use optimized
        fs_1.default.unlinkSync(req.file.path);
        req.file.path = outputPath;
        req.file.filename = path_1.default.basename(outputPath);
        next();
    }
    catch (error) {
        logger_1.default.error('Error processing image:', error);
        next(error);
    }
};
exports.processImage = processImage;
// Set upload type middleware
const setUploadType = (type) => {
    return (req, res, next) => {
        req.uploadType = type;
        next();
    };
};
exports.setUploadType = setUploadType;
//# sourceMappingURL=upload.middleware.js.map