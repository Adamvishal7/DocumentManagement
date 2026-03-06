const jwt = require("jsonwebtoken");
const {
  generateToken,
  authenticateToken,
} = require("../../../middleware/auth");

// Mock environment variables
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "24h";

describe("Authentication Middleware", () => {
  describe("generateToken", () => {
    it("should generate a valid JWT token with user information", () => {
      const user = {
        id: 1,
        email: "test@example.com",
        role: "Admin",
      };

      const token = generateToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      // Verify token contains correct payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    it("should generate token with 24-hour expiration", () => {
      const user = {
        id: 1,
        email: "test@example.com",
        role: "Employee",
      };

      const token = generateToken(user);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check that exp is set (approximately 24 hours from now)
      expect(decoded.exp).toBeDefined();
      const expirationTime = decoded.exp - decoded.iat;
      expect(expirationTime).toBe(24 * 60 * 60); // 24 hours in seconds
    });

    it("should throw error if JWT_SECRET is not configured", () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const user = {
        id: 1,
        email: "test@example.com",
        role: "Viewer",
      };

      expect(() => generateToken(user)).toThrow("JWT_SECRET is not configured");

      // Restore secret
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe("authenticateToken", () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        headers: {},
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      next = jest.fn();
    });

    it("should authenticate valid token and attach user to request", () => {
      const user = {
        id: 1,
        email: "test@example.com",
        role: "Admin",
      };

      const token = generateToken(user);
      req.headers["authorization"] = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(user.id);
      expect(req.user.email).toBe(user.email);
      expect(req.user.role).toBe(user.role);
    });

    it("should return 401 if no authorization header is provided", () => {
      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Authentication required",
        message: "No token provided",
        code: "NO_TOKEN",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if authorization header format is invalid", () => {
      req.headers["authorization"] = "InvalidFormat";

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Authentication required",
        message: "Invalid authorization header format",
        code: "INVALID_HEADER",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if token is invalid", () => {
      req.headers["authorization"] = "Bearer invalid-token";

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Authentication required",
        message: "Invalid token",
        code: "INVALID_TOKEN",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if token is expired", (done) => {
      const user = {
        id: 1,
        email: "test@example.com",
        role: "Employee",
      };

      // Create an expired token (expires immediately)
      const expiredToken = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "0s",
      });

      req.headers["authorization"] = `Bearer ${expiredToken}`;

      // Wait a moment to ensure token is expired
      setTimeout(() => {
        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: "Authentication required",
          message: "Your session has expired. Please log in again.",
          code: "TOKEN_EXPIRED",
        });
        expect(next).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it("should extract token from Bearer format correctly", () => {
      const user = {
        id: 42,
        email: "employee@example.com",
        role: "Employee",
      };

      const token = generateToken(user);
      req.headers["authorization"] = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.id).toBe(42);
    });

    it("should handle case-sensitive authorization header", () => {
      const user = {
        id: 1,
        email: "test@example.com",
        role: "Viewer",
      };

      const token = generateToken(user);
      // Test with lowercase 'authorization'
      req.headers["authorization"] = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
    });
  });
});
