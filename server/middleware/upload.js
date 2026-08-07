import multer from "multer";
import path from "path";
import fs from "fs";

const docDir = "uploads/documents";
fs.mkdirSync(docDir, { recursive: true });

export const ALLOWED_DOC_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function rejectUnsafeFile(file, cb) {
  const err = new Error(`File type not allowed (${file.mimetype}). Allowed: PDF, images, plain text, CSV, and Office documents.`);
  err.isOperational = true;
  err.statusCode = 400;
  cb(err);
}

export function docFileFilter(req, file, cb) {
  if (ALLOWED_DOC_MIME.has(file.mimetype)) return cb(null, true);
  return rejectUnsafeFile(file, cb);
}

export const documentStorage = multer.diskStorage({
  destination: docDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

export const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: docFileFilter,
});
