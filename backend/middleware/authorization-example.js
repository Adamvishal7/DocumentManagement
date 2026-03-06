/**
 * Authorization Middleware Usage Examples
 *
 * This file demonstrates how to use the requireRole middleware
 * in combination with authenticateToken for role-based access control.
 */

const express = require("express");
const { authenticateToken } = require("./auth");
const { requireRole } = require("./authorization");

const router = express.Router();

// ============================================================================
// EXAMPLE 1: Admin-only endpoints
// ============================================================================

/**
 * User Management - Admin only
 * Requirements: 7.1, 7.5
 */
router.get(
  "/api/users",
  authenticateToken,
  requireRole("Admin"),
  (req, res) => {
    // Only Admin users can access this endpoint
    res.json({ message: "List of all users" });
  },
);

router.post(
  "/api/users",
  authenticateToken,
  requireRole("Admin"),
  (req, res) => {
    // Only Admin users can create new users
    res.json({ message: "User created" });
  },
);

router.delete(
  "/api/users/:id",
  authenticateToken,
  requireRole("Admin"),
  (req, res) => {
    // Only Admin users can delete users
    res.json({ message: "User deleted" });
  },
);

/**
 * Category Management - Admin only
 * Requirements: 3.4
 */
router.post(
  "/api/categories",
  authenticateToken,
  requireRole("Admin"),
  (req, res) => {
    // Only Admin users can create categories
    res.json({ message: "Category created" });
  },
);

router.put(
  "/api/categories/:id",
  authenticateToken,
  requireRole("Admin"),
  (req, res) => {
    // Only Admin users can update categories
    res.json({ message: "Category updated" });
  },
);

router.delete(
  "/api/categories/:id",
  authenticateToken,
  requireRole("Admin"),
  (req, res) => {
    // Only Admin users can delete categories
    res.json({ message: "Category deleted" });
  },
);

/**
 * Document Deletion - Admin only
 * Requirements: 10.4
 */
router.delete(
  "/api/documents/:id",
  authenticateToken,
  requireRole("Admin"),
  (req, res) => {
    // Only Admin users can delete documents
    res.json({ message: "Document deleted" });
  },
);

/**
 * Activity Log - Admin only
 * Requirements: 11.4
 */
router.get(
  "/api/activities",
  authenticateToken,
  requireRole("Admin"),
  (req, res) => {
    // Only Admin users can view activity logs
    res.json({ message: "Activity log" });
  },
);

// ============================================================================
// EXAMPLE 2: Admin and Employee endpoints
// ============================================================================

/**
 * Document Upload - Admin and Employee
 * Requirements: 2.1, 2.5
 */
router.post(
  "/api/documents/upload",
  authenticateToken,
  requireRole("Admin", "Employee"),
  (req, res) => {
    // Both Admin and Employee users can upload documents
    res.json({ message: "Document uploaded" });
  },
);

/**
 * Version Upload - Admin and Employee
 * Requirements: 6.1
 */
router.post(
  "/api/documents/:id/versions",
  authenticateToken,
  requireRole("Admin", "Employee"),
  (req, res) => {
    // Both Admin and Employee users can upload new versions
    res.json({ message: "New version uploaded" });
  },
);

// ============================================================================
// EXAMPLE 3: All authenticated users (Admin, Employee, Viewer)
// ============================================================================

/**
 * Document Download - All authenticated users
 * Requirements: 5.3
 */
router.get(
  "/api/documents/:id/download",
  authenticateToken,
  requireRole("Admin", "Employee", "Viewer"),
  (req, res) => {
    // All authenticated users can download documents
    res.json({ message: "Document downloaded" });
  },
);

/**
 * Document Search - All authenticated users
 * Requirements: 4.1
 */
router.get(
  "/api/documents/search",
  authenticateToken,
  requireRole("Admin", "Employee", "Viewer"),
  (req, res) => {
    // All authenticated users can search documents
    res.json({ message: "Search results" });
  },
);

/**
 * Document List - All authenticated users
 * Requirements: 8.1
 */
router.get(
  "/api/documents",
  authenticateToken,
  requireRole("Admin", "Employee", "Viewer"),
  (req, res) => {
    // All authenticated users can view document list
    res.json({ message: "Document list" });
  },
);

/**
 * Category List - All authenticated users
 * Requirements: 3.1
 */
router.get(
  "/api/categories",
  authenticateToken,
  requireRole("Admin", "Employee", "Viewer"),
  (req, res) => {
    // All authenticated users can view categories
    res.json({ message: "Category list" });
  },
);

/**
 * Dashboard Statistics - All authenticated users
 * Requirements: 9.1, 9.2, 9.3, 9.4
 * Note: Response content varies by role (Admin sees additional stats)
 */
router.get(
  "/api/dashboard/stats",
  authenticateToken,
  requireRole("Admin", "Employee", "Viewer"),
  (req, res) => {
    // All authenticated users can view dashboard
    // The response content will be filtered based on role in the handler
    const stats = {
      totalDocuments: 100,
      totalCategories: 5,
      recentDocuments: [],
    };

    // Admin-only fields
    if (req.user.role === "Admin") {
      stats.totalUsers = 50;
      stats.usersByRole = { Admin: 5, Employee: 30, Viewer: 15 };
    }

    res.json(stats);
  },
);

// ============================================================================
// EXAMPLE 4: Error handling scenarios
// ============================================================================

/**
 * Example of what happens when a Viewer tries to upload
 */
router.post(
  "/api/documents/upload-demo",
  authenticateToken,
  requireRole("Admin", "Employee"),
  (req, res) => {
    // If a Viewer tries to access this endpoint, they will receive:
    // Status: 403
    // Response: {
    //   error: "Insufficient permissions",
    //   message: "You do not have permission to access this resource. Required role: Admin or Employee",
    //   requiredRole: ["Admin", "Employee"],
    //   currentRole: "Viewer",
    //   code: "FORBIDDEN"
    // }
    res.json({ message: "Upload successful" });
  },
);

/**
 * Example of what happens when no token is provided
 */
router.get(
  "/api/protected-demo",
  authenticateToken,
  requireRole("Admin"),
  (req, res) => {
    // If no token is provided, authenticateToken will return:
    // Status: 401
    // Response: {
    //   error: "Authentication required",
    //   message: "No token provided",
    //   code: "NO_TOKEN"
    // }

    // If token is invalid/expired, authenticateToken will return:
    // Status: 401
    // Response: {
    //   error: "Authentication required",
    //   message: "Your session has expired. Please log in again.",
    //   code: "TOKEN_EXPIRED"
    // }

    // If authenticated but wrong role, requireRole will return:
    // Status: 403
    // Response: {
    //   error: "Insufficient permissions",
    //   message: "You do not have permission to access this resource. Required role: Admin",
    //   requiredRole: "Admin",
    //   currentRole: "Employee",
    //   code: "FORBIDDEN"
    // }

    res.json({ message: "Protected resource accessed" });
  },
);

// ============================================================================
// EXAMPLE 5: Middleware order matters
// ============================================================================

/**
 * CORRECT ORDER: authenticateToken MUST come before requireRole
 *
 * 1. authenticateToken verifies the JWT and sets req.user
 * 2. requireRole checks req.user.role for authorization
 */
router.get(
  "/api/correct-order",
  authenticateToken, // First: Authenticate
  requireRole("Admin"), // Second: Authorize
  (req, res) => {
    res.json({ message: "Success" });
  },
);

/**
 * INCORRECT ORDER: This will not work properly
 *
 * If requireRole comes before authenticateToken, req.user will be undefined
 * and the authorization check will fail with 401 Unauthorized
 */
// router.get("/api/incorrect-order",
//   requireRole("Admin"),   // Wrong: req.user doesn't exist yet
//   authenticateToken,      // Wrong: Too late
//   (req, res) => {
//     res.json({ message: "This won't work" });
//   }
// );

module.exports = router;
