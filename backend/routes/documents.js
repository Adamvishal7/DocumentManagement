const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/authorization");
const { uploadMiddleware } = require("../middleware/upload");
const documentService = require("../services/documentService");
const versionService = require("../services/versionService");
const categoryService = require("../services/categoryService");
const { getFullPath } = require("../services/fileStorage");

/**
 * Document API Endpoints
 *
 * Provides REST API for document management:
 * - GET /api/documents - List all documents with pagination
 * - POST /api/documents/upload - Upload new document or version
 * - GET /api/documents/:id - Get document details
 * - GET /api/documents/:id/download - Download current version
 * - GET /api/documents/:id/versions - Get version history
 * - GET /api/documents/:id/versions/:versionNumber/download - Download specific version
 * - DELETE /api/documents/:id - Delete document (Admin only)
 *
 * Requirements: 2.1, 2.5, 5.1, 5.2, 5.3, 6.4, 6.5, 8.1, 10.1, 10.4
 */

/**
 * GET /api/documents
 * Get all documents with pagination and sorting
 * Authorization: All authenticated users
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const sortColumn = req.query.sort || "upload_date";
    const sortOrder = req.query.order || "DESC";

    const result = await documentService.getAllDocuments(
      page,
      limit,
      sortColumn,
      sortOrder,
    );

    res.json(result);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch documents",
    });
  }
});

/**
 * POST /api/documents/upload
 * Upload new document or new version
 * Authorization: Admin, Employee
 */
router.post(
  "/upload",
  authenticateToken,
  requireRole("Admin", "Employee"),
  uploadMiddleware,
  async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          error: "Validation error",
          message: "No file provided",
          code: "NO_FILE",
        });
      }

      // Get category from request body
      const categoryId = parseInt(req.body.categoryId);
      if (!categoryId) {
        return res.status(400).json({
          error: "Validation error",
          message: "Category is required",
          code: "CATEGORY_REQUIRED",
        });
      }

      // Verify category exists
      const category = await categoryService.getCategoryById(categoryId);
      if (!category) {
        return res.status(400).json({
          error: "Validation error",
          message: "Invalid category",
          code: "INVALID_CATEGORY",
        });
      }

      // Check if this is a new version (documentId provided)
      const documentId = req.body.documentId
        ? parseInt(req.body.documentId)
        : null;

      // Upload document
      const document = await documentService.uploadDocument(
        req.file,
        category.name,
        categoryId,
        req.user.id,
        documentId,
      );

      res.status(201).json({
        message: documentId
          ? "New version uploaded successfully"
          : "Document uploaded successfully",
        document,
      });
    } catch (error) {
      console.error("Error uploading document:", error);

      // Handle validation errors
      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation error",
          message: error.message,
          code: error.code,
          field: error.field,
        });
      }

      // Handle storage errors
      if (error.code === "STORAGE_ERROR") {
        return res.status(507).json({
          error: "Storage error",
          message: error.message,
          code: "STORAGE_ERROR",
        });
      }

      // Handle document not found (for versioning)
      if (error.code === "DOCUMENT_NOT_FOUND") {
        return res.status(404).json({
          error: "Not found",
          message: error.message,
          code: "DOCUMENT_NOT_FOUND",
        });
      }

      res.status(500).json({
        error: "Internal server error",
        message: "Failed to upload document",
      });
    }
  },
);

/**
 * GET /api/documents/:id
 * Get document details by ID
 * Authorization: All authenticated users
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);

    const document = await documentService.getDocumentById(documentId);

    if (!document) {
      return res.status(404).json({
        error: "Not found",
        message: "Document not found",
        code: "DOCUMENT_NOT_FOUND",
      });
    }

    res.json({ document });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch document",
    });
  }
});

/**
 * GET /api/documents/:id/download
 * Download current version of document
 * Authorization: All authenticated users
 */
router.get("/:id/download", authenticateToken, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);

    const result = await documentService.downloadDocument(documentId);

    // Set headers for file download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`,
    );
    res.setHeader("Content-Type", "application/octet-stream");

    // Send file buffer
    res.send(result.buffer);
  } catch (error) {
    console.error("Error downloading document:", error);

    if (error.code === "DOCUMENT_NOT_FOUND") {
      return res.status(404).json({
        error: "Not found",
        message: "Document not found",
        code: "DOCUMENT_NOT_FOUND",
      });
    }

    if (error.code === "FILE_NOT_FOUND") {
      return res.status(404).json({
        error: "Not found",
        message: "File not found in storage",
        code: "FILE_NOT_FOUND",
      });
    }

    res.status(500).json({
      error: "Internal server error",
      message: "Failed to download document",
    });
  }
});

/**
 * GET /api/documents/:id/versions
 * Get version history for a document
 * Authorization: All authenticated users
 */
router.get("/:id/versions", authenticateToken, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);

    // Verify document exists
    const document = await documentService.getDocumentById(documentId);
    if (!document) {
      return res.status(404).json({
        error: "Not found",
        message: "Document not found",
        code: "DOCUMENT_NOT_FOUND",
      });
    }

    const versions = await versionService.getVersionHistory(documentId);

    res.json({ versions });
  } catch (error) {
    console.error("Error fetching version history:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch version history",
    });
  }
});

/**
 * GET /api/documents/:id/versions/:versionNumber/download
 * Download specific version of document
 * Authorization: All authenticated users
 */
router.get(
  "/:id/versions/:versionNumber/download",
  authenticateToken,
  async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const versionNumber = parseInt(req.params.versionNumber);

      const result = await documentService.downloadDocument(
        documentId,
        versionNumber,
      );

      // Set headers for file download
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.filename} (v${result.version})"`,
      );
      res.setHeader("Content-Type", "application/octet-stream");

      // Send file buffer
      res.send(result.buffer);
    } catch (error) {
      console.error("Error downloading document version:", error);

      if (error.code === "DOCUMENT_NOT_FOUND") {
        return res.status(404).json({
          error: "Not found",
          message: "Document not found",
          code: "DOCUMENT_NOT_FOUND",
        });
      }

      if (error.code === "VERSION_NOT_FOUND") {
        return res.status(404).json({
          error: "Not found",
          message: error.message,
          code: "VERSION_NOT_FOUND",
        });
      }

      if (error.code === "FILE_NOT_FOUND") {
        return res.status(404).json({
          error: "Not found",
          message: "File not found in storage",
          code: "FILE_NOT_FOUND",
        });
      }

      res.status(500).json({
        error: "Internal server error",
        message: "Failed to download document version",
      });
    }
  },
);

/**
 * DELETE /api/documents/:id
 * Delete document and all versions
 * Authorization: Admin only
 */
router.delete(
  "/:id",
  authenticateToken,
  requireRole("Admin"),
  async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);

      const result = await documentService.deleteDocument(documentId);

      if (!result.success) {
        return res.status(404).json({
          error: "Not found",
          message: result.error,
          code: "DOCUMENT_NOT_FOUND",
        });
      }

      res.json({
        message: "Document deleted successfully",
        result,
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to delete document",
      });
    }
  },
);

module.exports = router;
