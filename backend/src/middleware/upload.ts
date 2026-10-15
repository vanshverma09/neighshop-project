import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req: Request, _file: Express.Multer.File, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req: Request, file: Express.Multer.File, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'listing-' + uniqueSuffix + ext);
  }
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (allowedTypes.test(ext) && mime.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are permitted.'));
  }
}

export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per image
  fileFilter: fileFilter
});
