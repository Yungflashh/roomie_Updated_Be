// src/config/cloudinary.config.ts
import { v2 as cloudinary } from 'cloudinary';

// Get env vars and trim whitespace
const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

// Configure Cloudinary
cloudinary.config({
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

export { cloudinary };