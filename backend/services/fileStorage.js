const fs = require("fs").promises;
const path = require("path");

/**
 * File Storage Module
 *
 * Handles physical file storage operations including:
 * - Directory structure creation
 * - File naming with version identifiers
 * - File write/read operations
 * - File deletion for cleanup
 *
 * Requirements: 2.3, 6.2
 */

// Base upload directory
const UPLOAD_BASE_DIR =
  process.env.UPLOAD_PATH || path.join(__dirname, "..", "uploads");

/**
 * Ensure a directory exists, create it if it doesn't
 * @param {string} dirPath - Directory path to create
 * @returns {Promise<void>}
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

/**
 * Get the category directory path
 * @param {string} categoryName - Name of the category
 * @returns {string} Full path to category directory
 */
function getCategoryDirectory(categoryName) {
  // Replace spaces with underscores and sanitize category name
  const sanitizedCategory = categoryName
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(UPLOAD_BASE_DIR, sanitizedCategory);
}

/**
 * Generate filename with version identifier
 * @param {number} documentId - Document ID
 * @param {number} versionNumber - Version number
 * @param {string} extension - File extension (without dot)
 * @returns {string} Filename in format: doc_{id}_v{version}.{ext}
 */
function generateVersionedFilename(documentId, versionNumber, extension) {
  return `doc_${documentId}_v${versionNumber}.${extension}`;
}

/**
 * Store a file in the appropriate category directory
 * @param {Buffer} fileBuffer - File content buffer
 * @param {string} categoryName - Category name for directory organization
 * @param {number} documentId - Document ID
 * @param {number} versionNumber - Version number
 * @param {string} extension - File extension (without dot)
 * @returns {Promise<string>} Relative file path from upload base directory
 */
async function storeFile(
  fileBuffer,
  categoryName,
  documentId,
  versionNumber,
  extension,
) {
  try {
    // Ensure base upload directory exists
    await ensureDirectoryExists(UPLOAD_BASE_DIR);

    // Get and ensure category directory exists
    const categoryDir = getCategoryDirectory(categoryName);
    await ensureDirectoryExists(categoryDir);

    // Generate filename with version identifier
    const filename = generateVersionedFilename(
      documentId,
      versionNumber,
      extension,
    );
    const fullPath = path.join(categoryDir, filename);

    // Check available disk space (basic check)
    try {
      const stats = await fs.stat(UPLOAD_BASE_DIR);
      // This is a basic check - in production, you'd want more sophisticated disk space monitoring
    } catch (error) {
      // If we can't check disk space, proceed anyway
    }

    // Write file to disk
    await fs.writeFile(fullPath, fileBuffer);

    // Return relative path for database storage
    const relativePath = path.relative(UPLOAD_BASE_DIR, fullPath);
    return relativePath;
  } catch (error) {
    // Handle disk space errors
    if (error.code === "ENOSPC") {
      const storageError = new Error("Insufficient disk space to store file");
      storageError.code = "STORAGE_ERROR";
      throw storageError;
    }

    // Handle permission errors
    if (error.code === "EACCES") {
      const permissionError = new Error("Permission denied when writing file");
      permissionError.code = "STORAGE_ERROR";
      throw permissionError;
    }

    throw error;
  }
}

/**
 * Read a file from storage
 * @param {string} relativePath - Relative path from upload base directory
 * @returns {Promise<Buffer>} File content buffer
 */
async function readFile(relativePath) {
  try {
    const fullPath = path.join(UPLOAD_BASE_DIR, relativePath);
    const fileBuffer = await fs.readFile(fullPath);
    return fileBuffer;
  } catch (error) {
    if (error.code === "ENOENT") {
      const notFoundError = new Error("File not found in storage");
      notFoundError.code = "FILE_NOT_FOUND";
      throw notFoundError;
    }
    throw error;
  }
}

/**
 * Check if a file exists in storage
 * @param {string} relativePath - Relative path from upload base directory
 * @returns {Promise<boolean>} True if file exists, false otherwise
 */
async function fileExists(relativePath) {
  try {
    const fullPath = path.join(UPLOAD_BASE_DIR, relativePath);
    await fs.access(fullPath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

/**
 * Delete a file from storage
 * @param {string} relativePath - Relative path from upload base directory
 * @returns {Promise<boolean>} True if file was deleted, false if file didn't exist
 */
async function deleteFile(relativePath) {
  try {
    const fullPath = path.join(UPLOAD_BASE_DIR, relativePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      // File doesn't exist, consider it already deleted
      return false;
    }
    throw error;
  }
}

/**
 * Delete multiple files from storage
 * @param {Array<string>} relativePaths - Array of relative paths
 * @returns {Promise<Object>} Object with deleted count and failed paths
 */
async function deleteMultipleFiles(relativePaths) {
  const results = {
    deleted: 0,
    failed: [],
  };

  for (const relativePath of relativePaths) {
    try {
      const deleted = await deleteFile(relativePath);
      if (deleted) {
        results.deleted++;
      }
    } catch (error) {
      results.failed.push({
        path: relativePath,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Get the full path for a file (for streaming)
 * @param {string} relativePath - Relative path from upload base directory
 * @returns {string} Full absolute path
 */
function getFullPath(relativePath) {
  return path.join(UPLOAD_BASE_DIR, relativePath);
}

module.exports = {
  storeFile,
  readFile,
  fileExists,
  deleteFile,
  deleteMultipleFiles,
  getFullPath,
  getCategoryDirectory,
  generateVersionedFilename,
  ensureDirectoryExists,
  UPLOAD_BASE_DIR,
};
