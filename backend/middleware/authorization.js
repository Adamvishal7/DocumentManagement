/**
 * Authorization Middleware
 * Implements role-based access control (RBAC) for the Document Upload & Management System
 *
 * Roles:
 * - Admin: Full system access (all operations)
 * - Employee: Upload, download, search, and view operations
 * - Viewer: View and download operations only
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

/**
 * Middleware factory to enforce role-based access control
 * Returns a middleware function that checks if the authenticated user has one of the allowed roles
 *
 * @param {...string} allowedRoles - One or more role names that are permitted to access the endpoint
 * @returns {Function} Express middleware function
 *
 * @example
 * // Single role
 * router.post('/upload', authenticateToken, requireRole('Admin'), uploadHandler);
 *
 * @example
 * // Multiple roles
 * router.post('/upload', authenticateToken, requireRole('Admin', 'Employee'), uploadHandler);
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    try {
      // Ensure user is authenticated (should be set by authenticateToken middleware)
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "User authentication is required to access this resource",
          code: "UNAUTHORIZED",
        });
      }

      // Check if user has a role
      if (!req.user.role) {
        return res.status(403).json({
          error: "Insufficient permissions",
          message: "User role is not defined",
          code: "NO_ROLE",
        });
      }

      // Check if user's role is in the allowed roles list
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: "Insufficient permissions",
          message: `You do not have permission to access this resource. Required role: ${allowedRoles.join(" or ")}`,
          requiredRole:
            allowedRoles.length === 1 ? allowedRoles[0] : allowedRoles,
          currentRole: req.user.role,
          code: "FORBIDDEN",
        });
      }

      // User has required role, proceed to next middleware
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: "An unexpected error occurred during authorization",
        code: "INTERNAL_ERROR",
      });
    }
  };
}

module.exports = {
  requireRole,
};
