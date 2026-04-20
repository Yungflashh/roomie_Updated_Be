import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

if (!cloudName || !apiKey || !apiSecret) {
  logger.warn('Cloudinary credentials incomplete — media uploads will fail');
}

export { cloudinary };
