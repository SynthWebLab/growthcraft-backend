import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ValidationError } from '@/common/errors/ValidationError';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `resume-${Date.now()}-${baseName}${ext}`);
  },
});

// File validation filter
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Only PDF, DOC, or DOCX documents are allowed as resume uploads.'), false);
  }
};

// Multer instance
export const uploadResumeMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single('resume');
