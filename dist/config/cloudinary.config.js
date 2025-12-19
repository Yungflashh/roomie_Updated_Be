"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = void 0;
// src/config/cloudinary.config.ts
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
// Get env vars and trim whitespace
const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
});
// Log configuration status
console.log('☁️ Cloudinary configured:', {
    cloud_name: cloudName,
    api_key: apiKey ? '✓ Set' : '✗ Missing',
    api_secret: apiSecret ? '✓ Set' : '✗ Missing',
});
//# sourceMappingURL=cloudinary.config.js.map