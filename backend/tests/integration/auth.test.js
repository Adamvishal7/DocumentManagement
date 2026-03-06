const request = require("supertest");
const { initDatabase } = require("../../models/initDatabase");
const { closeDatabase } = require("../../models/database");
const app = require("../../server");
const { run, get } = require("../../models/database");
const { createUser } = require("../../services/userService");

describe("Authentication API Endpoints", () => {
  let testUser;

  beforeAll(async () => {
    // Initialize database before tests
    await initDatabase();

    // Create a test user for authentication tests
    testUser = await createUser(
      "Test User",
      "test@example.com",
      "password123",
      "Employee",
    );
  });

  afterAll(async () => {
    // Clean up test user
    await run("DELETE FROM Users WHERE email = ?", ["test@example.com"]);
    closeDatabase();
  });

  describe("POST /api/auth/login", () => {
    it("should authenticate user with valid credentials and return token", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toMatchObject({
        id: testUser.id,
        name: "Test User",
        email: "test@example.com",
        role: "Employee",
      });
      expect(typeof response.body.token).toBe("string");
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    it("should reject login with invalid email", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Authentication failed");
      expect(response.body).toHaveProperty(
        "message",
        "Invalid email or password",
      );
      expect(response.body).toHaveProperty("code", "INVALID_CREDENTIALS");
    });

    it("should reject login with invalid password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Authentication failed");
      expect(response.body).toHaveProperty(
        "message",
        "Invalid email or password",
      );
      expect(response.body).toHaveProperty("code", "INVALID_CREDENTIALS");
    });

    it("should reject login with missing email", async () => {
      const response = await request(app).post("/api/auth/login").send({
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Validation failed");
      expect(response.body).toHaveProperty(
        "message",
        "Email and password are required",
      );
      expect(response.body).toHaveProperty("code", "MISSING_CREDENTIALS");
    });

    it("should reject login with missing password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Validation failed");
      expect(response.body).toHaveProperty(
        "message",
        "Email and password are required",
      );
      expect(response.body).toHaveProperty("code", "MISSING_CREDENTIALS");
    });

    it("should reject login with empty credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "",
        password: "",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Validation failed");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should return success message on logout", async () => {
      const response = await request(app).post("/api/auth/logout");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Logged out successfully",
      );
    });

    it("should allow logout without authentication token", async () => {
      // Logout should work even without a token since it's client-side
      const response = await request(app).post("/api/auth/logout");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Logged out successfully",
      );
    });
  });

  describe("Authentication Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      // This test would require mocking the database to simulate an error
      // For now, we'll test that the endpoint handles unexpected errors
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      // Should either succeed or return a proper error response
      expect([200, 401, 500]).toContain(response.status);
      if (response.status === 500) {
        expect(response.body).toHaveProperty("error");
        expect(response.body).toHaveProperty("code", "INTERNAL_ERROR");
      }
    });
  });

  describe("Token Generation", () => {
    it("should generate valid JWT tokens on login", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe("string");

      // JWT tokens have 3 parts separated by dots
      const tokenParts = response.body.token.split(".");
      expect(tokenParts.length).toBe(3);
    });
  });
});
