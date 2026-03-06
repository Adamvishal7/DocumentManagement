const { run, get, all } = require("../models/database");

/**
 * Version Service
 *
 * Handles document version tracking including:
 * - Creating version records
 * - Retrieving version history
 * - Getting specific versions
 * - Calculating next version numbers
 *
 * Requirements: 6.1, 6.3, 6.4, 6.5
 */

/**
 * Create a new version record
 * @param {number} documentId - Document ID
 * @param {number} versionNumber - Version number
 * @param {string} filePath - Relative path to the version file
 * @param {number} fileSize - File size in bytes
 * @returns {Promise<Object>} Created version object
 */
async function createVersion(
  documentId,
  versionNumber,
  filePath,
  fileSize = 0,
) {
  try {
    const result = await run(
      "INSERT INTO Document_Versions (document_id, version_number, file_path, file_size) VALUES (?, ?, ?, ?)",
      [documentId, versionNumber, filePath, fileSize],
    );

    return {
      id: result.lastID,
      documentId,
      versionNumber,
      filePath,
      fileSize,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    // Handle unique constraint violation
    if (error.message.includes("UNIQUE constraint failed")) {
      throw new Error(
        `Version ${versionNumber} already exists for document ${documentId}`,
      );
    }
    throw error;
  }
}

/**
 * Get version history for a document
 * @param {number} documentId - Document ID
 * @returns {Promise<Array>} Array of version objects ordered by version number
 */
async function getVersionHistory(documentId) {
  try {
    const versions = await all(
      `SELECT 
        dv.id,
        dv.document_id,
        dv.version_number,
        dv.file_path,
        dv.uploaded_at,
        u.name as uploaded_by_name
      FROM Document_Versions dv
      LEFT JOIN Documents d ON dv.document_id = d.id
      LEFT JOIN Users u ON d.uploaded_by = u.id
      WHERE dv.document_id = ?
      ORDER BY dv.version_number ASC`,
      [documentId],
    );

    return versions.map((version) => ({
      id: version.id,
      documentId: version.document_id,
      versionNumber: version.version_number,
      filePath: version.file_path,
      uploadedAt: version.uploaded_at,
      uploadedBy: version.uploaded_by_name,
    }));
  } catch (error) {
    throw error;
  }
}

/**
 * Get a specific version of a document
 * @param {number} documentId - Document ID
 * @param {number} versionNumber - Version number
 * @returns {Promise<Object|null>} Version object or null if not found
 */
async function getVersion(documentId, versionNumber) {
  try {
    const version = await get(
      `SELECT 
        dv.id,
        dv.document_id,
        dv.version_number,
        dv.file_path,
        dv.uploaded_at,
        u.name as uploaded_by_name
      FROM Document_Versions dv
      LEFT JOIN Documents d ON dv.document_id = d.id
      LEFT JOIN Users u ON d.uploaded_by = u.id
      WHERE dv.document_id = ? AND dv.version_number = ?`,
      [documentId, versionNumber],
    );

    if (!version) {
      return null;
    }

    return {
      id: version.id,
      documentId: version.document_id,
      versionNumber: version.version_number,
      filePath: version.file_path,
      uploadedAt: version.uploaded_at,
      uploadedBy: version.uploaded_by_name,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get the next version number for a document
 * @param {number} documentId - Document ID
 * @returns {Promise<number>} Next version number (1 if no versions exist)
 */
async function getNextVersionNumber(documentId) {
  try {
    const result = await get(
      "SELECT MAX(version_number) as max_version FROM Document_Versions WHERE document_id = ?",
      [documentId],
    );

    // If no versions exist, start at 1
    if (!result || result.max_version === null) {
      return 1;
    }

    return result.max_version + 1;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all version records for a document (for deletion)
 * @param {number} documentId - Document ID
 * @returns {Promise<Array>} Array of version objects with file paths
 */
async function getAllVersionsForDocument(documentId) {
  try {
    const versions = await all(
      "SELECT id, document_id, version_number, file_path FROM Document_Versions WHERE document_id = ?",
      [documentId],
    );

    return versions.map((version) => ({
      id: version.id,
      documentId: version.document_id,
      versionNumber: version.version_number,
      filePath: version.file_path,
    }));
  } catch (error) {
    throw error;
  }
}

/**
 * Delete all versions for a document
 * @param {number} documentId - Document ID
 * @returns {Promise<number>} Number of versions deleted
 */
async function deleteAllVersions(documentId) {
  try {
    const result = await run(
      "DELETE FROM Document_Versions WHERE document_id = ?",
      [documentId],
    );

    return result.changes;
  } catch (error) {
    throw error;
  }
}

/**
 * Get the current version number for a document
 * @param {number} documentId - Document ID
 * @returns {Promise<number|null>} Current version number or null if no versions
 */
async function getCurrentVersionNumber(documentId) {
  try {
    const result = await get(
      "SELECT MAX(version_number) as current_version FROM Document_Versions WHERE document_id = ?",
      [documentId],
    );

    return result?.current_version || null;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createVersion,
  getVersionHistory,
  getVersion,
  getNextVersionNumber,
  getAllVersionsForDocument,
  deleteAllVersions,
  getCurrentVersionNumber,
};
