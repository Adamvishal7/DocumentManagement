const multer = require("multer");

/**
 * File Upload Middleware with Multer
 *
 * Configures Multer for handling multipart form data with:
 * - Memory storage for validation before disk write
 * - File size limit (20MB)
 * - File filter for allowed extensions
 *
 * Requirements: 2.1, 2.2
 */

// Maximum file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Allowed file extensions
const ALLOWED_EXTENSIONS = ["pdf", "docx", "xlsx", "png", "jpg", "jpeg"];

/**
 * File filter function for Multer
 * Performs initial extension check before upload
 */
function fileFilter(req, file, cb) {
  // Get file extension
  const extension = file.originalname.split(".").pop().toLowerCase();

  // Check if extension is allowed
  if (ALLOWED_EXTENSIONS.includes(extension)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type '${extension}' is not supported. Allowed types: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}`,
      ),
      false,
    );
  }
}

/**
 * Multer configuration with memory storage
 * Files are stored in memory (buffer) for validation before writing to disk
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: fileFilter,
});

/**
 * Middleware for single file upload
 * Field name: 'file'
 */
const uploadSingle = upload.single("file");

/**
 * Error handling wrapper for Multer middleware
 * Converts Multer errors to consistent error format
 */
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "File too large",
        message: `File size exceeds 20MB limit. Please upload a smaller file.`,
        code: "FILE_TOO_LARGE",
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "Unexpected field",
        message: "Unexpected file field. Please use 'file' as the field name.",
        code: "UNEXPECTED_FIELD",
      });
    }

    // Other Multer errors
    return res.status(400).json({
      error: "Upload error",
      message: err.message,
      code: "UPLOAD_ERROR",
    });
  }

  if (err) {
    // File filter errors or other errors
    return res.status(400).json({
      error: "Validation error",
      message: err.message,
      code: "VALIDATION_ERROR",
    });
  }

  next();
}

/**
 * Combined middleware for file upload with error handling
 */
function uploadMiddleware(req, res, next) {
  uploadSingle(req, res, (err) => {
    handleUploadError(err, req, res, next);
  });
}

module.exports = {
  uploadMiddleware,
  uploadSingle,
  handleUploadError,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
};
