const request = require("supertest");
const express = require("express");
const { generateToken, authenticateToken } = require("../../middleware/auth");

// Mock environment variables
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "24h";

// Create a test Express app
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Public endpoint (no authentication required)
  app.get("/api/public", (req, res) => {
    res.json({ message: "Public endpoint" });
  });

  // Protected endpoint (authentication required)
  app.get("/api/protected", authenticateToken, (req, res) => {
    res.json({
      message: "Protected endpoint",
      user: req.user,
    });
  });

  // Login endpoint (generates token)
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    // Mock authentication (in real app, this would verify credentials)
    if (email === "test@example.com" && password === "password123") {
      const user = {
        id: 1,
        email: "test@example.com",
        role: "Admin",
      };

      const token = generateToken(user);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  return app;
}

describe("Authentication Integration Tests", () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe("Public endpoints", () => {
    it("should allow access to public endpoints without token", async () => {
      const response = await request(app).get("/api/public");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Public endpoint");
    });
  });

  describe("Protected endpoints", () => {
    it("should deny access to protected endpoints without token", async () => {
      const response = await request(app).get("/api/protected");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Authentication required");
      expect(response.body.code).toBe("NO_TOKEN");
    });

    it("should deny access with invalid token", async () => {
      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Authentication required");
      expect(response.body.code).toBe("INVALID_TOKEN");
    });

    it("should allow access with valid token", async () => {
      // First, login to get a token
      const loginResponse = await request(app).post("/api/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(loginResponse.status).toBe(200);
      const { token } = loginResponse.body;

      // Then, access protected endpoint with token
      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Protected endpoint");
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(1);
      expect(response.body.user.email).toBe("test@example.com");
      expect(response.body.user.role).toBe("Admin");
    });

    it("should extract user information from token correctly", async () => {
      const user = {
        id: 42,
        email: "employee@example.com",
        role: "Employee",
      };

      const token = generateToken(user);

      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe(42);
      expect(response.body.user.email).toBe("employee@example.com");
      expect(response.body.user.role).toBe("Employee");
    });
  });

  describe("Login flow", () => {
    it("should generate token on successful login", async () => {
      const response = await request(app).post("/api/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe("string");
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(1);
      expect(response.body.user.email).toBe("test@example.com");
      expect(response.body.user.role).toBe("Admin");
    });

    it("should reject login with invalid credentials", async () => {
      const response = await request(app).post("/api/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid credentials");
    });

    it("should allow access to protected endpoint after login", async () => {
      // Login
      const loginResponse = await request(app).post("/api/login").send({
        email: "test@example.com",
        password: "password123",
      });

      const { token } = loginResponse.body;

      // Access protected endpoint
      const protectedResponse = await request(app)
        .get("/api/protected")
        .set("Authorization", `Bearer ${token}`);

      expect(protectedResponse.status).toBe(200);
      expect(protectedResponse.body.user.email).toBe("test@example.com");
    });
  });

  describe("Token format handling", () => {
    it("should handle Bearer token format correctly", async () => {
      const user = {
        id: 1,
        email: "test@example.com",
        role: "Viewer",
      };

      const token = generateToken(user);

      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it("should reject token without Bearer prefix", async () => {
      const user = {
        id: 1,
        email: "test@example.com",
        role: "Admin",
      };

      const token = generateToken(user);

      const response = await request(app)
        .get("/api/protected")
        .set("Authorization", token); // Missing "Bearer " prefix

      expect(response.status).toBe(401);
      expect(response.body.code).toBe("INVALID_HEADER");
    });

    it("should handle missing authorization header", async () => {
      const response = await request(app).get("/api/protected");

      expect(response.status).toBe(401);
      expect(response.body.code).toBe("NO_TOKEN");
    });
  });
});
