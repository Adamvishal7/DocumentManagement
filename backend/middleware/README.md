# Authentication Middleware

This directory contains middleware functions for authentication and authorization in the Document Upload & Management System.

## auth.js

Provides JWT-based authentication middleware for protecting API endpoints.

### Functions

#### `generateToken(user)`

Generates a JWT token for a user with 24-hour expiration.

**Parameters:**

- `user` (Object): User object containing:
  - `id` (number): User ID
  - `email` (string): User email
  - `role` (string): User role (Admin, Employee, Viewer)

**Returns:**

- `string`: JWT token

**Example:**

```javascript
const { generateToken } = require("./middleware/auth");

const user = {
  id: 1,
  email: "user@example.com",
  role: "Admin",
};

const token = generateToken(user);
// Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### `authenticateToken(req, res, next)`

Express middleware that verifies JWT token from Authorization header and attaches user information to the request object.

**Behavior:**

- Extracts token from `Authorization` header (format: `Bearer <token>`)
- Verifies token signature and expiration
- Attaches decoded user information to `req.user`
- Returns 401 error if token is missing, invalid, or expired

**Request Headers:**

- `Authorization`: `Bearer <jwt-token>`

**Response on Success:**

- Calls `next()` and attaches `req.user` with:
  - `id` (number): User ID
  - `email` (string): User email
  - `role` (string): User role

**Response on Failure:**

- Status: 401 Unauthorized
- Body:
  ```json
  {
    "error": "Authentication required",
    "message": "Error description",
    "code": "ERROR_CODE"
  }
  ```

**Error Codes:**

- `NO_TOKEN`: No Authorization header provided
- `INVALID_HEADER`: Authorization header format is invalid
- `TOKEN_EXPIRED`: Token has expired (24 hours)
- `INVALID_TOKEN`: Token signature is invalid
- `VERIFICATION_FAILED`: Other token verification errors

**Example Usage:**

```javascript
const express = require("express");
const { authenticateToken } = require("./middleware/auth");

const app = express();

// Protected route - requires authentication
app.get("/api/documents", authenticateToken, (req, res) => {
  // req.user is available here
  console.log("User:", req.user.email, "Role:", req.user.role);
  res.json({ documents: [] });
});

// Public route - no authentication required
app.get("/api/public", (req, res) => {
  res.json({ message: "Public endpoint" });
});
```

### Environment Variables

The authentication middleware requires the following environment variables:

- `JWT_SECRET` (required): Secret key for signing JWT tokens
- `JWT_EXPIRES_IN` (optional): Token expiration time (default: "24h")

**Example .env:**

```
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

### Security Considerations

1. **JWT_SECRET**: Must be a strong, random string in production. Never commit the actual secret to version control.

2. **Token Expiration**: Tokens expire after 24 hours as per requirements. Users must re-authenticate after expiration.

3. **HTTPS**: In production, always use HTTPS to prevent token interception.

4. **Token Storage**: Frontend should store tokens securely (e.g., httpOnly cookies or secure localStorage).

5. **Token Validation**: The middleware validates:
   - Token signature
   - Token expiration
   - Token format

### Testing

Unit tests and integration tests are available:

```bash
# Run unit tests
npm test -- tests/unit/middleware/auth.test.js

# Run integration tests
npm test -- tests/integration/auth.integration.test.js

# Run all tests
npm test
```

### Integration with User Service

The authentication middleware works with the User Service for complete authentication flow:

```javascript
const express = require("express");
const { generateToken, authenticateToken } = require("./middleware/auth");
const { authenticateUser } = require("./services/userService");

const app = express();
app.use(express.json());

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Authenticate user with User Service
    const user = await authenticateUser(email, password);

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    // Generate JWT token
    const token = generateToken(user);

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
      message: "An unexpected error occurred",
    });
  }
});

// Protected endpoint
app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({
    user: req.user,
  });
});
```

### Client-Side Usage

Frontend applications should include the token in the Authorization header:

```javascript
// Login
const loginResponse = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "user@example.com",
    password: "password123",
  }),
});

const { token, user } = await loginResponse.json();

// Store token (e.g., in localStorage)
localStorage.setItem("token", token);

// Use token for authenticated requests
const documentsResponse = await fetch("http://localhost:5000/api/documents", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const documents = await documentsResponse.json();
```

### Error Handling

The middleware provides detailed error responses for different failure scenarios:

```javascript
// No token provided
{
  "error": "Authentication required",
  "message": "No token provided",
  "code": "NO_TOKEN"
}

// Invalid token format
{
  "error": "Authentication required",
  "message": "Invalid authorization header format",
  "code": "INVALID_HEADER"
}

// Expired token
{
  "error": "Authentication required",
  "message": "Your session has expired. Please log in again.",
  "code": "TOKEN_EXPIRED"
}

// Invalid token signature
{
  "error": "Authentication required",
  "message": "Invalid token",
  "code": "INVALID_TOKEN"
}
```

Frontend applications should handle these errors appropriately:

```javascript
try {
  const response = await fetch("/api/protected", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    const error = await response.json();

    if (error.code === "TOKEN_EXPIRED") {
      // Redirect to login page
      window.location.href = "/login";
    } else {
      // Show error message
      alert(error.message);
    }
  }
} catch (error) {
  console.error("Request failed:", error);
}
```

## Future Enhancements

Potential improvements for the authentication system:

1. **Token Refresh**: Implement refresh tokens for seamless re-authentication
2. **Token Revocation**: Add ability to invalidate tokens (e.g., on logout)
3. **Rate Limiting**: Prevent brute force attacks on authentication endpoints
4. **Multi-Factor Authentication**: Add 2FA support for enhanced security
5. **Session Management**: Track active sessions per user
6. **Password Reset**: Implement secure password reset flow with tokens
