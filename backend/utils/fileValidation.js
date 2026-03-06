const fileType = require("file-type");

/**
 * File Validation Module
 *
 * Provides comprehensive file validation for document uploads including:
 * - File extension validation
 * - File size validation
 * - MIME type verification
 * - Executable content detection
 *
 * Requirements: 2.1, 2.2, 12.1, 12.2, 12.3, 12.4
 */

// Configuration constants
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes

const ALLOWED_EXTENSIONS = ["pdf", "docx", "xlsx", "png", "jpg", "jpeg"];

// MIME type mappings for allowed file types
const MIME_TYPE_MAP = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
};

// Executable file signatures (magic bytes) to detect
const EXECUTABLE_SIGNATURES = [
  Buffer.from([0x4d, 0x5a]), // MZ - DOS/Windows executable
  Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // ELF - Linux executable
  Buffer.from([0xcf, 0xfa, 0xed, 0xfe]), // Mach-O - macOS executable (32-bit)
  Buffer.from([0xce, 0xfa, 0xed, 0xfe]), // Mach-O - macOS executable (reverse byte order)
  Buffer.from([0xfe, 0xed, 0xfa, 0xce]), // Mach-O - macOS executable (64-bit)
  Buffer.from([0xfe, 0xed, 0xfa, 0xcf]), // Mach-O - macOS executable (64-bit reverse)
  Buffer.from([0x23, 0x21]), // #! - Shell script shebang
];

/**
 * Custom error classes for validation failures
 */
class ValidationError extends Error {
  constructor(message, field, code) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    this.code = code;
  }
}

class FileSizeError extends ValidationError {
  constructor(size) {
    super(
      `File size exceeds 20MB limit. Please upload a smaller file. (Current size: ${(size / (1024 * 1024)).toFixed(2)}MB)`,
      "file",
      "FILE_TOO_LARGE",
    );
    this.size = size;
  }
}

class FileExtensionError extends ValidationError {
  constructor(extension) {
    super(
      `File type '${extension}' is not supported. Allowed types: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}`,
      "file",
      "INVALID_FILE_TYPE",
    );
    this.extension = extension;
  }
}

class MimeTypeMismatchError extends ValidationError {
  constructor(extension, detectedMime) {
    super(
      `File content does not match the file extension. Expected ${extension.toUpperCase()} file but detected ${detectedMime || "unknown"} content.`,
      "file",
      "MIME_TYPE_MISMATCH",
    );
    this.extension = extension;
    this.detectedMime = detectedMime;
  }
}

class ExecutableContentError extends ValidationError {
  constructor() {
    super(
      "File contains executable content and cannot be uploaded for security reasons.",
      "file",
      "EXECUTABLE_CONTENT_DETECTED",
    );
  }
}

/**
 * Validates file extension against allowed types
 *
 * @param {string} filename - The name of the file
 * @returns {string} - The validated extension in lowercase
 * @throws {FileExtensionError} - If extension is not allowed
 *
 * Requirements: 2.1, 12.1
 */
function validateFileExtension(filename) {
  if (!filename || typeof filename !== "string") {
    throw new ValidationError("Invalid filename", "file", "INVALID_FILENAME");
  }

  const extension = filename.split(".").pop().toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new FileExtensionError(extension);
  }

  return extension;
}

/**
 * Validates file size against maximum limit
 *
 * @param {number} size - The size of the file in bytes
 * @throws {FileSizeError} - If file size exceeds limit
 *
 * Requirements: 2.2
 */
function validateFileSize(size) {
  if (typeof size !== "number" || size < 0) {
    throw new ValidationError("Invalid file size", "file", "INVALID_FILE_SIZE");
  }

  if (size > MAX_FILE_SIZE) {
    throw new FileSizeError(size);
  }

  if (size === 0) {
    throw new ValidationError("File is empty", "file", "EMPTY_FILE");
  }
}

/**
 * Verifies MIME type matches the file extension using file-type library
 *
 * @param {Buffer} buffer - The file buffer to analyze
 * @param {string} extension - The expected file extension
 * @returns {Promise<void>}
 * @throws {MimeTypeMismatchError} - If MIME type doesn't match extension
 *
 * Requirements: 12.2, 12.3
 */
async function validateMimeType(buffer, extension) {
  if (!Buffer.isBuffer(buffer)) {
    throw new ValidationError("Invalid file buffer", "file", "INVALID_BUFFER");
  }

  if (!extension || !ALLOWED_EXTENSIONS.includes(extension.toLowerCase())) {
    throw new ValidationError(
      "Invalid extension for MIME validation",
      "file",
      "INVALID_EXTENSION",
    );
  }

  // Get the actual MIME type from file content
  const detectedType = await fileType.fromBuffer(buffer);

  // For Office documents (DOCX, XLSX), file-type may not detect them
  // as they are ZIP archives. We need special handling.
  if (["docx", "xlsx"].includes(extension.toLowerCase())) {
    // Check if it's a ZIP file (Office documents are ZIP-based)
    if (detectedType && detectedType.mime === "application/zip") {
      // Additional check: Office files should have PK signature at start
      if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
        return; // Valid Office document
      }
    }
    // If we can't detect it but it has the ZIP signature, allow it
    if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
      return;
    }
    throw new MimeTypeMismatchError(extension, detectedType?.mime);
  }

  // For other file types, verify MIME type matches
  const expectedMimes = MIME_TYPE_MAP[extension.toLowerCase()];

  if (!detectedType) {
    throw new MimeTypeMismatchError(extension, "unknown");
  }

  if (!expectedMimes.includes(detectedType.mime)) {
    throw new MimeTypeMismatchError(extension, detectedType.mime);
  }
}

/**
 * Detects executable content in file buffer
 *
 * @param {Buffer} buffer - The file buffer to scan
 * @throws {ExecutableContentError} - If executable content is detected
 *
 * Requirements: 12.4
 */
function detectExecutableContent(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new ValidationError("Invalid file buffer", "file", "INVALID_BUFFER");
  }

  // Check for executable signatures at the start of the file
  for (const signature of EXECUTABLE_SIGNATURES) {
    if (buffer.length >= signature.length) {
      const fileStart = buffer.slice(0, signature.length);
      if (fileStart.equals(signature)) {
        throw new ExecutableContentError();
      }
    }
  }

  // Additional check for script content in the first 1KB
  // Look for common script patterns
  const sampleSize = Math.min(buffer.length, 1024);
  const sample = buffer.slice(0, sampleSize).toString("utf-8", 0, sampleSize);

  // Check for script tags or executable patterns
  const dangerousPatterns = [
    /<script[\s>]/i,
    /<%[\s\S]*?%>/, // ASP/JSP
    /<\?php/i,
    /eval\s*\(/i,
    /exec\s*\(/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sample)) {
      throw new ExecutableContentError();
    }
  }
}

/**
 * Comprehensive file validation
 * Validates extension, size, MIME type, and checks for executable content
 *
 * @param {Object} file - File object with buffer, originalname, and size
 * @param {Buffer} file.buffer - The file buffer
 * @param {string} file.originalname - The original filename
 * @param {number} file.size - The file size in bytes
 * @returns {Promise<Object>} - Validation result with extension
 * @throws {ValidationError} - If any validation fails
 *
 * Requirements: 2.1, 2.2, 12.1, 12.2, 12.3, 12.4
 */
async function validateFile(file) {
  if (!file) {
    throw new ValidationError("No file provided", "file", "NO_FILE");
  }

  // Validate file extension
  const extension = validateFileExtension(file.originalname);

  // Validate file size
  validateFileSize(file.size);

  // Ensure we have a buffer to work with
  if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new ValidationError(
      "File buffer is missing or invalid",
      "file",
      "INVALID_BUFFER",
    );
  }

  // Detect executable content
  detectExecutableContent(file.buffer);

  // Validate MIME type
  await validateMimeType(file.buffer, extension);

  return {
    valid: true,
    extension,
    size: file.size,
    filename: file.originalname,
  };
}

module.exports = {
  validateFile,
  validateFileExtension,
  validateFileSize,
  validateMimeType,
  detectExecutableContent,
  ValidationError,
  FileSizeError,
  FileExtensionError,
  MimeTypeMismatchError,
  ExecutableContentError,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
  MIME_TYPE_MAP,
};
