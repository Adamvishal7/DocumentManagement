const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/authorization");
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../services/categoryService");

/**
 * GET /api/categories
 * Retrieve all categories with document counts
 * Authorization: All authenticated users
 * Response: { categories: [{ id, name, createdAt, documentCount }] }
 * Status Codes: 200, 401, 500
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const categories = await getAllCategories();

    res.status(200).json({
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred while retrieving categories",
      code: "INTERNAL_ERROR",
    });
  }
});

/**
 * POST /api/categories
 * Create a new category
 * Authorization: Admin only
 * Request Body: { name: string }
 * Response: { category: { id, name, createdAt, documentCount } }
 * Status Codes: 201, 400, 401, 403, 500
 */
router.post("/", authenticateToken, requireRole("Admin"), async (req, res) => {
  try {
    const { name } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Category name is required",
        field: "name",
        code: "MISSING_NAME",
      });
    }

    // Create category
    const category = await createCategory(name);

    res.status(201).json({
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);

    // Handle validation errors
    if (
      error.message.includes("already exists") ||
      error.message.includes("non-empty string")
    ) {
      return res.status(400).json({
        error: "Validation failed",
        message: error.message,
        field: "name",
        code: "VALIDATION_ERROR",
      });
    }

    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred while creating category",
      code: "INTERNAL_ERROR",
    });
  }
});

/**
 * PUT /api/categories/:id
 * Update category name
 * Authorization: Admin only
 * Request Body: { name: string }
 * Response: { category: { id, name, createdAt, documentCount } }
 * Status Codes: 200, 400, 401, 403, 404, 500
 */
router.put(
  "/:id",
  authenticateToken,
  requireRole("Admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      // Validate ID
      const categoryId = parseInt(id, 10);
      if (isNaN(categoryId) || categoryId <= 0) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Invalid category ID",
          field: "id",
          code: "INVALID_ID",
        });
      }

      // Validate input
      if (!name) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Category name is required",
          field: "name",
          code: "MISSING_NAME",
        });
      }

      // Update category
      const category = await updateCategory(categoryId, name);

      if (!category) {
        return res.status(404).json({
          error: "Not found",
          message: "Category not found",
          code: "CATEGORY_NOT_FOUND",
        });
      }

      res.status(200).json({
        category,
      });
    } catch (error) {
      console.error("Update category error:", error);

      // Handle validation errors
      if (
        error.message.includes("already exists") ||
        error.message.includes("non-empty string")
      ) {
        return res.status(400).json({
          error: "Validation failed",
          message: error.message,
          field: "name",
          code: "VALIDATION_ERROR",
        });
      }

      res.status(500).json({
        error: "Internal server error",
        message: "An unexpected error occurred while updating category",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

/**
 * DELETE /api/categories/:id
 * Delete a category
 * Authorization: Admin only
 * Response: { message: "Category deleted successfully" }
 * Status Codes: 200, 400 (has documents), 401, 403, 404, 500
 */
router.delete(
  "/:id",
  authenticateToken,
  requireRole("Admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validate ID
      const categoryId = parseInt(id, 10);
      if (isNaN(categoryId) || categoryId <= 0) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Invalid category ID",
          field: "id",
          code: "INVALID_ID",
        });
      }

      // Delete category
      const deleted = await deleteCategory(categoryId);

      if (!deleted) {
        return res.status(404).json({
          error: "Not found",
          message: "Category not found",
          code: "CATEGORY_NOT_FOUND",
        });
      }

      res.status(200).json({
        message: "Category deleted successfully",
      });
    } catch (error) {
      console.error("Delete category error:", error);

      // Handle category with documents error
      if (error.message.includes("Cannot delete category with documents")) {
        return res.status(400).json({
          error: "Validation failed",
          message: error.message,
          code: "CATEGORY_HAS_DOCUMENTS",
        });
      }

      res.status(500).json({
        error: "Internal server error",
        message: "An unexpected error occurred while deleting category",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

module.exports = router;
