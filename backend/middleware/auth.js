const jwt = require("jsonwebtoken");

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object containing id, email, and role
 * @returns {string} JWT token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  // Token expires in 24 hours as per requirements
  const expiresIn = process.env.JWT_EXPIRES_IN || "24h";

  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Middleware to authenticate JWT token from Authorization header
 * Verifies the token and attaches user information to req.user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function authenticateToken(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return res.status(401).json({
        error: "Authentication required",
        message: "No token provided",
        code: "NO_TOKEN",
      });
    }

    // Authorization header format: "Bearer <token>"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Invalid authorization header format",
        code: "INVALID_HEADER",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    // Verify token
    jwt.verify(token, secret, (err, user) => {
      if (err) {
        // Handle different JWT errors
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            error: "Authentication required",
            message: "Your session has expired. Please log in again.",
            code: "TOKEN_EXPIRED",
          });
        }

        if (err.name === "JsonWebTokenError") {
          return res.status(401).json({
            error: "Authentication required",
            message: "Invalid token",
            code: "INVALID_TOKEN",
          });
        }

        // Other JWT errors
        return res.status(401).json({
          error: "Authentication required",
          message: "Token verification failed",
          code: "VERIFICATION_FAILED",
        });
      }

      // Attach user information to request object
      req.user = user;
      next();
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred during authentication",
      code: "INTERNAL_ERROR",
    });
  }
}

module.exports = {
  generateToken,
  authenticateToken,
};
