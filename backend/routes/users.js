const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/authorization");
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../services/userService");

/**
 * POST /api/users
 * Create a new user (public for signup, Admin for creating other users)
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Name, email, and password are required",
        code: "MISSING_FIELDS",
      });
    }

    // Default role to Employee for public signup
    const userRole = role || "Employee";

    // Only Admin can create Admin or specific roles
    if (req.user && req.user.role !== "Admin" && role) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: "Only Admin can assign specific roles",
        code: "FORBIDDEN",
      });
    }

    const user = await createUser(name, email, password, userRole);

    res.status(201).json({
      user,
    });
  } catch (error) {
    console.error("Create user error:", error);

    if (
      error.message.includes("already exists") ||
      error.message.includes("Invalid role")
    ) {
      return res.status(400).json({
        error: "Validation failed",
        message: error.message,
        code: "VALIDATION_ERROR",
      });
    }

    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred while creating user",
      code: "INTERNAL_ERROR",
    });
  }
});

/**
 * GET /api/users
 * Get all users (Admin only)
 */
router.get("/", authenticateToken, requireRole("Admin"), async (req, res) => {
  try {
    const users = await getAllUsers();

    res.status(200).json({
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred while retrieving users",
      code: "INTERNAL_ERROR",
    });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID (Admin only)
 */
router.get(
  "/:id",
  authenticateToken,
  requireRole("Admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id, 10);

      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Invalid user ID",
          code: "INVALID_ID",
        });
      }

      const user = await getUserById(userId);

      if (!user) {
        return res.status(404).json({
          error: "Not found",
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      res.status(200).json({
        user,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "An unexpected error occurred while retrieving user",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

/**
 * PUT /api/users/:id
 * Update user (Admin only)
 */
router.put(
  "/:id",
  authenticateToken,
  requireRole("Admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id, 10);

      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Invalid user ID",
          code: "INVALID_ID",
        });
      }

      const updates = req.body;
      const user = await updateUser(userId, updates);

      if (!user) {
        return res.status(404).json({
          error: "Not found",
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      res.status(200).json({
        user,
      });
    } catch (error) {
      console.error("Update user error:", error);

      if (
        error.message.includes("already exists") ||
        error.message.includes("Invalid role")
      ) {
        return res.status(400).json({
          error: "Validation failed",
          message: error.message,
          code: "VALIDATION_ERROR",
        });
      }

      res.status(500).json({
        error: "Internal server error",
        message: "An unexpected error occurred while updating user",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

/**
 * DELETE /api/users/:id
 * Delete user (Admin only)
 */
router.delete(
  "/:id",
  authenticateToken,
  requireRole("Admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id, 10);

      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Invalid user ID",
          code: "INVALID_ID",
        });
      }

      const deleted = await deleteUser(userId);

      if (!deleted) {
        return res.status(404).json({
          error: "Not found",
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      res.status(200).json({
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "An unexpected error occurred while deleting user",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

module.exports = router;
