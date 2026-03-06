# Authorization Middleware

## Overview

The authorization middleware implements role-based access control (RBAC) for the Document Upload & Management System. It enforces permission levels based on user roles (Admin, Employee, Viewer) as specified in Requirements 7.1, 7.2, 7.3, and 7.4.

## Features

- **Role-Based Access Control**: Restrict endpoints to specific user roles
- **Multiple Role Support**: Allow multiple roles to access the same endpoint
- **Clear Error Messages**: Provide descriptive error responses with role information
- **Flexible Configuration**: Easy to apply to any route with minimal code
- **Security First**: Returns 403 Forbidden for unauthorized access attempts

## User Roles

The system supports three user roles with different permission levels:

### Admin

- **Full system access**
- Can perform all operations including:
  - Upload, download, search, view, and delete documents
  - Create, modify, and delete categories
  - Create, modify, and delete user accounts
  - View activity logs
  - Access all dashboard statistics

### Employee

- **Upload and download permissions**
- Can perform:
  - Upload documents and new versions
  - Download documents
  - Search and view documents
  - View categories and dashboard statistics

### Viewer

- **Read-only access**
- Can perform:
  - View and download documents
  - Search documents
  - View categories and dashboard statistics

## Installation

The middleware is already included in the project. No additional installation is required.

## Usage

### Basic Usage

```javascript
const { authenticateToken } = require("./middleware/auth");
const { requireRole } = require("./middleware/authorization");

// Admin-only endpoint
router.delete(
  "/api/documents/:id",
  authenticateToken, // First: Authenticate the user
  requireRole("Admin"), // Second: Check if user is Admin
  deleteDocumentHandler,
);
```

### Multiple Roles

```javascript
// Admin and Employee can upload documents
router.post(
  "/api/documents/upload",
  authenticateToken,
  requireRole("Admin", "Employee"), // Allow multiple roles
  uploadDocumentHandler,
);
```

### All Authenticated Users

```javascript
// All authenticated users can download documents
router.get(
  "/api/documents/:id/download",
  authenticateToken,
  requireRole("Admin", "Employee", "Viewer"), // All roles
  downloadDocumentHandler,
);
```

## API Reference

### `requireRole(...allowedRoles)`

Factory function that creates an Express middleware for role-based authorization.

**Parameters:**

- `...allowedRoles` (string): One or more role names that are permitted to access the endpoint

**Returns:**

- Express middleware function `(req, res, next)`

**Example:**

```javascript
const middleware = requireRole("Admin", "Employee");
```

## Middleware Behavior

### Success Case

When the user has one of the required roles:

- Calls `next()` to proceed to the next middleware
- No response is sent

### Error Cases

#### 1. User Not Authenticated (401)

When `req.user` is not set (authenticateToken middleware not run or failed):

```json
{
  "error": "Authentication required",
  "message": "User authentication is required to access this resource",
  "code": "UNAUTHORIZED"
}
```

#### 2. User Has No Role (403)

When `req.user.role` is undefined:

```json
{
  "error": "Insufficient permissions",
  "message": "User role is not defined",
  "code": "NO_ROLE"
}
```

#### 3. Insufficient Permissions (403)

When user's role is not in the allowed roles list:

**Single Role:**

```json
{
  "error": "Insufficient permissions",
  "message": "You do not have permission to access this resource. Required role: Admin",
  "requiredRole": "Admin",
  "currentRole": "Employee",
  "code": "FORBIDDEN"
}
```

**Multiple Roles:**

```json
{
  "error": "Insufficient permissions",
  "message": "You do not have permission to access this resource. Required role: Admin or Employee",
  "requiredRole": ["Admin", "Employee"],
  "currentRole": "Viewer",
  "code": "FORBIDDEN"
}
```

#### 4. Internal Server Error (500)

When an unexpected error occurs:

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred during authorization",
  "code": "INTERNAL_ERROR"
}
```

## Middleware Order

**CRITICAL:** The middleware must be applied in the correct order:

1. **authenticateToken** - Verifies JWT and sets `req.user`
2. **requireRole** - Checks `req.user.role` for authorization
3. **Route handler** - Processes the request

### ✅ Correct Order

```javascript
router.post(
  "/api/documents/upload",
  authenticateToken, // 1. Authenticate first
  requireRole("Admin"), // 2. Then authorize
  uploadHandler, // 3. Finally handle request
);
```

### ❌ Incorrect Order

```javascript
// This will NOT work - req.user doesn't exist yet
router.post(
  "/api/documents/upload",
  requireRole("Admin"), // Wrong: req.user is undefined
  authenticateToken, // Wrong: Too late
  uploadHandler,
);
```

## Common Patterns

### Pattern 1: Admin-Only Operations

```javascript
// User management
router.post(
  "/api/users",
  authenticateToken,
  requireRole("Admin"),
  createUserHandler,
);
router.delete(
  "/api/users/:id",
  authenticateToken,
  requireRole("Admin"),
  deleteUserHandler,
);

// Category management
router.post(
  "/api/categories",
  authenticateToken,
  requireRole("Admin"),
  createCategoryHandler,
);
router.delete(
  "/api/categories/:id",
  authenticateToken,
  requireRole("Admin"),
  deleteCategoryHandler,
);

// Document deletion
router.delete(
  "/api/documents/:id",
  authenticateToken,
  requireRole("Admin"),
  deleteDocumentHandler,
);

// Activity logs
router.get(
  "/api/activities",
  authenticateToken,
  requireRole("Admin"),
  getActivitiesHandler,
);
```

### Pattern 2: Admin and Employee Operations

```javascript
// Document upload
router.post(
  "/api/documents/upload",
  authenticateToken,
  requireRole("Admin", "Employee"),
  uploadDocumentHandler,
);

// Version upload
router.post(
  "/api/documents/:id/versions",
  authenticateToken,
  requireRole("Admin", "Employee"),
  uploadVersionHandler,
);
```

### Pattern 3: All Authenticated Users

```javascript
// Document operations
router.get(
  "/api/documents",
  authenticateToken,
  requireRole("Admin", "Employee", "Viewer"),
  listDocumentsHandler,
);

router.get(
  "/api/documents/:id/download",
  authenticateToken,
  requireRole("Admin", "Employee", "Viewer"),
  downloadDocumentHandler,
);

// Search
router.get(
  "/api/documents/search",
  authenticateToken,
  requireRole("Admin", "Employee", "Viewer"),
  searchDocumentsHandler,
);
```

### Pattern 4: Role-Specific Response Content

```javascript
// Dashboard with role-based content
router.get(
  "/api/dashboard/stats",
  authenticateToken,
  requireRole("Admin", "Employee", "Viewer"),
  (req, res) => {
    const stats = {
      totalDocuments: 100,
      totalCategories: 5,
      recentDocuments: [],
    };

    // Add admin-only fields
    if (req.user.role === "Admin") {
      stats.totalUsers = 50;
      stats.usersByRole = { Admin: 5, Employee: 30, Viewer: 15 };
    }

    res.json(stats);
  },
);
```

## Testing

The authorization middleware includes comprehensive unit tests covering:

- ✅ Unauthenticated user rejection (401)
- ✅ User with no role rejection (403)
- ✅ Insufficient permissions rejection (403)
- ✅ Single role authorization
- ✅ Multiple role authorization
- ✅ All three role types (Admin, Employee, Viewer)
- ✅ Role-based access scenarios
- ✅ Error handling

Run tests:

```bash
npm test -- authorization.test.js
```

## Requirements Validation

This middleware validates the following requirements:

- **Requirement 7.1**: Admin users have full system access
- **Requirement 7.2**: Employee users have upload, download, search, and view permissions
- **Requirement 7.3**: Viewer users have view and download permissions only
- **Requirement 7.4**: Unauthorized operations are denied with authorization error

## Security Considerations

1. **Always use with authenticateToken**: The authorization middleware depends on `req.user` being set by the authentication middleware

2. **Fail securely**: If any error occurs, the middleware denies access rather than allowing it

3. **Clear error messages**: Error responses include enough information for debugging without exposing sensitive system details

4. **No role elevation**: Users cannot access endpoints requiring higher privilege levels

5. **Explicit role checking**: Roles must be explicitly listed in `requireRole()` - there is no implicit role hierarchy

## Troubleshooting

### Issue: Getting 401 instead of 403

**Cause:** `authenticateToken` middleware is not running before `requireRole`

**Solution:** Ensure middleware order is correct:

```javascript
router.post(
  "/api/endpoint",
  authenticateToken, // Must come first
  requireRole("Admin"),
  handler,
);
```

### Issue: All users getting 403

**Cause:** User role is not being set correctly in JWT token

**Solution:** Verify that the JWT token includes the `role` field:

```javascript
const token = generateToken({
  id: user.id,
  email: user.email,
  role: user.role,
});
```

### Issue: Viewer can access Employee endpoints

**Cause:** Endpoint is not using `requireRole` middleware

**Solution:** Add `requireRole` middleware to the route:

```javascript
router.post(
  "/api/documents/upload",
  authenticateToken,
  requireRole("Admin", "Employee"), // Add this
  uploadHandler,
);
```

## Examples

See `authorization-example.js` for comprehensive usage examples including:

- Admin-only endpoints
- Admin and Employee endpoints
- All authenticated user endpoints
- Error handling scenarios
- Middleware ordering examples

## Related Files

- `auth.js` - Authentication middleware (must be used before authorization)
- `authorization.js` - Authorization middleware implementation
- `authorization-example.js` - Usage examples
- `tests/unit/middleware/authorization.test.js` - Unit tests

## Support

For questions or issues related to the authorization middleware, please refer to:

1. This README
2. The example file (`authorization-example.js`)
3. The unit tests (`tests/unit/middleware/authorization.test.js`)
4. The design document (`.kiro/specs/document-upload-management-system/design.md`)
