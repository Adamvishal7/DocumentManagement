const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../services/userService");
const { generateToken } = require("../middleware/auth");

/**
 * POST /api/auth/login
 * Authenticate user and issue JWT token
 * Request Body: { email: string, password: string }
 * Response: { token: string, user: { id, name, email, role } }
 * Status Codes: 200 (success), 401 (invalid credentials), 500 (server error)
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Email and password are required",
        code: "MISSING_CREDENTIALS",
      });
    }

    // Authenticate user
    const user = await authenticateUser(email, password);

    if (!user) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return token and user information
    res.status(200).json({
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
 * POST /api/auth/logout
 * Invalidate session (client-side token removal)
 * Response: { message: "Logged out successfully" }
 * Status Codes: 200
 */
router.post("/logout", (req, res) => {
  // Since we're using JWT tokens, logout is handled client-side by removing the token
  // This endpoint exists for consistency and can be extended later for token blacklisting
  res.status(200).json({
    message: "Logged out successfully",
  });
});

module.exports = router;
