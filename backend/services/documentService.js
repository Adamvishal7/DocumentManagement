const { run, get, all } = require("../models/database");
const { validateFile } = require("../utils/fileValidation");
const {
  storeFile,
  readFile,
  deleteMultipleFiles,
  fileExists,
} = require("./fileStorage");
const versionService = require("./versionService");

/**
 * Document Service
 *
 * Handles document management including:
 * - Document upload (new documents and versions)
 * - Document retrieval and listing
 * - Document download
 * - Document deletion with cleanup
 *
 * Requirements: 2.1, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.5, 10.1, 10.2
 */

/**
 * Upload a new document or new version of existing document
 * @param {Object} file - File object with buffer, originalname, and size
 * @param {string} categoryName - Category name
 * @param {number} categoryId - Category ID
 * @param {number} uploadedBy - User ID of uploader
 * @param {number|null} documentId - Document ID for versioning (null for new document)
 * @returns {Promise<Object>} Document object with version information
 */
async function uploadDocument(
  file,
  categoryName,
  categoryId,
  uploadedBy,
  documentId = null,
) {
  try {
    // Validate the file
    const validationResult = await validateFile(file);
    const extension = validationResult.extension;

    // Check if this is a new document or a new version
    if (documentId) {
      // Upload new version of existing document
      return await uploadNewVersion(file, documentId, categoryName, extension);
    } else {
      // Upload new document
      return await uploadNewDocument(
        file,
        categoryName,
        categoryId,
        uploadedBy,
        extension,
      );
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Upload a new document (version 1)
 * @private
 */
async function uploadNewDocument(
  file,
  categoryName,
  categoryId,
  uploadedBy,
  extension,
) {
  try {
    // Create document record first to get document ID
    const result = await run(
      "INSERT INTO Documents (document_name, category_id, uploaded_by, current_version) VALUES (?, ?, ?, ?)",
      [file.originalname, categoryId, uploadedBy, 1],
    );

    const documentId = result.lastID;

    // Store file with version 1
    const filePath = await storeFile(
      file.buffer,
      categoryName,
      documentId,
      1,
      extension,
    );

    // Create version record with file size
    await versionService.createVersion(documentId, 1, filePath, file.size);

    // Get complete document information
    return await getDocumentById(documentId);
  } catch (error) {
    // If anything fails, we should clean up
    // In a production system, you'd want transaction support
    throw error;
  }
}

/**
 * Upload a new version of an existing document
 * @private
 */
async function uploadNewVersion(file, documentId, categoryName, extension) {
  try {
    // Get current document to verify it exists
    const document = await getDocumentById(documentId);
    if (!document) {
      const error = new Error("Document not found");
      error.code = "DOCUMENT_NOT_FOUND";
      throw error;
    }

    // Get next version number
    const nextVersion = await versionService.getNextVersionNumber(documentId);

    // Store file with new version number
    const filePath = await storeFile(
      file.buffer,
      categoryName,
      documentId,
      nextVersion,
      extension,
    );

    // Create version record with file size
    await versionService.createVersion(
      documentId,
      nextVersion,
      filePath,
      file.size,
    );

    // Update document's current version
    await run(
      "UPDATE Documents SET current_version = ?, upload_date = CURRENT_TIMESTAMP WHERE id = ?",
      [nextVersion, documentId],
    );

    // Get updated document information
    return await getDocumentById(documentId);
  } catch (error) {
    throw error;
  }
}

/**
 * Get document by ID with full details
 * @param {number} id - Document ID
 * @returns {Promise<Object|null>} Document object or null if not found
 */
async function getDocumentById(id) {
  try {
    const document = await get(
      `SELECT 
        d.id,
        d.document_name,
        d.category_id,
        d.uploaded_by,
        d.upload_date,
        d.current_version,
        c.category_name,
        u.name as uploader_name
      FROM Documents d
      JOIN Categories c ON d.category_id = c.id
      JOIN Users u ON d.uploaded_by = u.id
      WHERE d.id = ?`,
      [id],
    );

    if (!document) {
      return null;
    }

    return {
      id: document.id,
      documentName: document.document_name,
      category: document.category_name,
      categoryId: document.category_id,
      uploadedBy: document.uploader_name,
      uploadedById: document.uploaded_by,
      uploadDate: document.upload_date,
      currentVersion: document.current_version,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get all documents with pagination and sorting
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Number of documents per page
 * @param {string} sortColumn - Column to sort by (default: upload_date)
 * @param {string} sortOrder - Sort order: ASC or DESC (default: DESC)
 * @returns {Promise<Object>} Object with documents array and pagination info
 */
async function getAllDocuments(
  page = 1,
  limit = 50,
  sortColumn = "upload_date",
  sortOrder = "DESC",
) {
  try {
    // Validate and sanitize sort parameters
    const allowedColumns = [
      "document_name",
      "category_name",
      "uploader_name",
      "upload_date",
      "current_version",
    ];
    const column = allowedColumns.includes(sortColumn)
      ? sortColumn
      : "upload_date";
    const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await get("SELECT COUNT(*) as total FROM Documents");
    const totalDocuments = countResult.total;
    const totalPages = Math.ceil(totalDocuments / limit);

    // Get documents with pagination
    const documents = await all(
      `SELECT 
        d.id,
        d.document_name,
        d.category_id,
        d.uploaded_by,
        d.upload_date,
        d.current_version,
        c.category_name,
        u.name as uploader_name,
        dv.file_size
      FROM Documents d
      JOIN Categories c ON d.category_id = c.id
      JOIN Users u ON d.uploaded_by = u.id
      LEFT JOIN Document_Versions dv ON d.id = dv.document_id AND dv.version_number = d.current_version
      ORDER BY ${column === "category_name" ? "c.category_name" : column === "uploader_name" ? "u.name" : "d." + column} ${order}
      LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    return {
      documents: documents.map((doc) => ({
        id: doc.id,
        document_name: doc.document_name,
        category_name: doc.category_name,
        category_id: doc.category_id,
        uploaded_by_name: doc.uploader_name,
        uploaded_by: doc.uploaded_by,
        upload_date: doc.upload_date,
        current_version: doc.current_version,
        file_size: doc.file_size || 0,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalDocuments,
        documentsPerPage: limit,
      },
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Download document (current version or specific version)
 * @param {number} documentId - Document ID
 * @param {number|null} versionNumber - Version number (null for current version)
 * @returns {Promise<Object>} Object with file buffer, filename, and metadata
 */
async function downloadDocument(documentId, versionNumber = null) {
  try {
    // Get document metadata
    const document = await getDocumentById(documentId);
    if (!document) {
      const error = new Error("Document not found");
      error.code = "DOCUMENT_NOT_FOUND";
      throw error;
    }

    // Determine which version to download
    const targetVersion = versionNumber || document.currentVersion;

    // Get version information
    const version = await versionService.getVersion(documentId, targetVersion);
    if (!version) {
      const error = new Error(`Version ${targetVersion} not found`);
      error.code = "VERSION_NOT_FOUND";
      throw error;
    }

    // Check if file exists
    const exists = await fileExists(version.filePath);
    if (!exists) {
      const error = new Error("File not found in storage");
      error.code = "FILE_NOT_FOUND";
      throw error;
    }

    // Read file from storage
    const fileBuffer = await readFile(version.filePath);

    return {
      buffer: fileBuffer,
      filename: document.documentName,
      version: version.versionNumber,
      filePath: version.filePath,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a document and all its versions
 * @param {number} documentId - Document ID
 * @returns {Promise<Object>} Deletion result with counts
 */
async function deleteDocument(documentId) {
  try {
    // Get document to verify it exists
    const document = await getDocumentById(documentId);
    if (!document) {
      return {
        success: false,
        error: "Document not found",
      };
    }

    // Get all version file paths
    const versions = await versionService.getAllVersionsForDocument(documentId);
    const filePaths = versions.map((v) => v.filePath);

    // Delete all version files from storage
    const fileDeleteResult = await deleteMultipleFiles(filePaths);

    // Delete version records from database (will cascade due to foreign key)
    const versionsDeleted = await versionService.deleteAllVersions(documentId);

    // Delete document record
    await run("DELETE FROM Documents WHERE id = ?", [documentId]);

    return {
      success: true,
      documentId,
      documentName: document.documentName,
      versionsDeleted,
      filesDeleted: fileDeleteResult.deleted,
      filesFailed: fileDeleteResult.failed,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get document by name (for searching)
 * @param {string} documentName - Document name
 * @returns {Promise<Array>} Array of matching documents
 */
async function getDocumentsByName(documentName) {
  try {
    const documents = await all(
      `SELECT 
        d.id,
        d.document_name,
        d.category_id,
        d.uploaded_by,
        d.upload_date,
        d.current_version,
        c.category_name,
        u.name as uploader_name
      FROM Documents d
      JOIN Categories c ON d.category_id = c.id
      JOIN Users u ON d.uploaded_by = u.id
      WHERE d.document_name LIKE ?
      ORDER BY d.upload_date DESC`,
      [`%${documentName}%`],
    );

    return documents.map((doc) => ({
      id: doc.id,
      documentName: doc.document_name,
      category: doc.category_name,
      categoryId: doc.category_id,
      uploadedBy: doc.uploader_name,
      uploadedById: doc.uploaded_by,
      uploadDate: doc.upload_date,
      currentVersion: doc.current_version,
    }));
  } catch (error) {
    throw error;
  }
}

module.exports = {
  uploadDocument,
  getDocumentById,
  getAllDocuments,
  downloadDocument,
  deleteDocument,
  getDocumentsByName,
};
