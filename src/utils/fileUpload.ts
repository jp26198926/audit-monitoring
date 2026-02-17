import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { generateUniqueFilename } from "./helpers";

// Ensure upload directory exists
async function ensureUploadDir() {
  const uploadDir = process.env.UPLOAD_DIR || "./public/uploads";
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = await ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = generateUniqueFilename(file.originalname);
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Allowed extensions
  const allowedExtensions = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".jpg",
    ".jpeg",
    ".png",
  ];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type not allowed. Allowed types: ${allowedExtensions.join(", ")}`,
      ),
    );
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
});

/**
 * Delete file from filesystem
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error("Failed to delete file:", error);
  }
}

/**
 * Get file URL from file path
 */
export function getFileUrl(filePath: string): string {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  // Remove 'public/' prefix if present
  const publicPath = filePath.replace(/^public[\\/]/, "");
  return `${appUrl}/${publicPath}`;
}
