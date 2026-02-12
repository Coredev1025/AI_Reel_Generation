import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { generateId, sanitizeFilename } from '../utils/helpers';

// Ensure upload directory exists
const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const tempDir = path.join(uploadDir, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = sanitizeFilename(path.basename(file.originalname, ext));
    cb(null, `${generateId()}_${safeName}${ext}`);
  },
});

const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.upload.allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid image type: ${file.mimetype}. Allowed: ${config.upload.allowedImageTypes.join(', ')}`));
  }
};

const audioFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.upload.allowedAudioTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid audio type: ${file.mimetype}. Allowed: ${config.upload.allowedAudioTypes.join(', ')}`));
  }
};

const logoFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid logo type: ${file.mimetype}`));
  }
};

export const uploadImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 50,
  },
}).array('photos', 50);

export const uploadMusic = multer({
  storage,
  fileFilter: audioFilter,
  limits: {
    fileSize: 20971520, // 20MB
    files: 1,
  },
}).single('music');

export const uploadLogo = multer({
  storage,
  fileFilter: logoFilter,
  limits: {
    fileSize: 5242880, // 5MB
    files: 1,
  },
}).single('logo');

export function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup errors
  }
}
