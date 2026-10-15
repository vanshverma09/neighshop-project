import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import fs from 'fs';

// Configure Cloudinary if credentials are present
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_URL || 
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

if (hasCloudinary) {
  if (process.env.CLOUDINARY_URL) {
    // Cloudinary automatically parses CLOUDINARY_URL
    cloudinary.config();
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }
  console.log('[Storage] Cloudinary CDN persistent storage enabled.');
} else {
  console.log('[Storage] Local disk / persistent volume storage enabled at /uploads.');
}

export class StorageService {
  /**
   * Uploads a single multer file to persistent cloud storage or local URL
   */
  static async uploadFile(file: Express.Multer.File, req: Request): Promise<string> {
    if (hasCloudinary) {
      try {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: 'neighshop_marketplace',
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }]
        });
        // Remove temporary local file after successful cloud upload
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch {
          // Ignore cleanup errors
        }
        return uploadResult.secure_url;
      } catch (err) {
        console.error('[Storage] Cloudinary upload failed, falling back to local storage URL:', err);
      }
    }

    // Default local disk / persistent volume path
    const host = req.get('host') || 'localhost:5000';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    return `${protocol}://${host}/uploads/${file.filename}`;
  }

  /**
   * Uploads multiple multer files
   */
  static async uploadMultiple(files: Express.Multer.File[], req: Request): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      const url = await this.uploadFile(file, req);
      urls.push(url);
    }
    return urls;
  }
}
