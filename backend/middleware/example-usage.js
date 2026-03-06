/**
 * Example usage of authentication middleware
 * This file demonstrates how to use the auth middleware in Express routes
 */

const express = require("express");
const { generateToken, authenticateToken } = require("./auth");
const { authenticateUser } = require("../services/userService");

const router = express.Router();

/**
 * Login endpoint - generates JWT token
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Email and password are required",
        code: "MISSING_FIELDS",
      });
    }

    // Authenticate user with User Service
    const user = await authenticateUser(email, password);

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Generate JWT token with 24-hour expiration
    const token = generateToken(user);

    // Return token and user information
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred during login",
      code: "INTERNAL_ERROR",
    });
  }
});

/**
 * Logout endpoint - client-side token removal
 * POST /api/auth/logout
 */
router.post("/api/auth/logout", (req, res) => {
  // JWT tokens are stateless, so logout is handled client-side
  // by removing the token from storage
  res.json({
    message: "Logged out successfully",
  });
});

/**
 * Protected endpoint example - requires authentication
 * GET /api/profile
 * Headers: Authorization: Bearer <token>
 */
router.get("/api/profile", authenticateToken, (req, res) => {
  // req.user is available after authenticateToken middleware
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

/**
 * Public endpoint example - no authentication required
 * GET /api/public
 */
router.get("/api/public", (req, res) => {
  res.json({
    message: "This is a public endpoint accessible without authentication",
  });
});

/**
 * Example of combining authentication with role-based authorization
 * This would typically be in a separate authorization middleware file
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "You must be logged in to access this resource",
        code: "NOT_AUTHENTICATED",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: `This action requires one of the following roles: ${allowedRoles.join(", ")}`,
        requiredRoles: allowedRoles,
        currentRole: req.user.role,
        code: "FORBIDDEN",
      });
    }

    next();
  };
}

/**
 * Admin-only endpoint example
 * GET /api/admin/users
 * Requires: Authentication + Admin role
 */
router.get(
  "/api/admin/users",
  authenticateToken,
  requireRole("Admin"),
  (req, res) => {
    res.json({
      message: "Admin-only endpoint",
      user: req.user,
    });
  },
);

/**
 * Employee or Admin endpoint example
 * POST /api/documents/upload
 * Requires: Authentication + (Employee OR Admin role)
 */
router.post(
  "/api/documents/upload",
  authenticateToken,
  requireRole("Admin", "Employee"),
  (req, res) => {
    res.json({
      message: "Document upload endpoint",
      user: req.user,
    });
  },
);

/**
 * All authenticated users endpoint example
 * GET /api/documents
 * Requires: Authentication (any role)
 */
router.get("/api/documents", authenticateToken, (req, res) => {
  res.json({
    message: "All authenticated users can access this",
    user: req.user,
  });
});

module.exports = router;
