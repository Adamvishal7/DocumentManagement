const request = require("supertest");
const app = require("../../server");
const { initDatabase } = require("../../models/initDatabase");
const { createUser } = require("../../services/userService");
const { generateToken } = require("../../middleware/auth");
const { run } = require("../../models/database");

describe("Category API Endpoints", () => {
  let adminToken;
  let employeeToken;
  let viewerToken;
  let adminUser;
  let employeeUser;
  let viewerUser;

  beforeAll(async () => {
    // Initialize database
    await initDatabase();

    // Create test users
    adminUser = await createUser(
      "Admin User",
      "admin@test.com",
      "password123",
      "Admin",
    );
    employeeUser = await createUser(
      "Employee User",
      "employee@test.com",
      "password123",
      "Employee",
    );
    viewerUser = await createUser(
      "Viewer User",
      "viewer@test.com",
      "password123",
      "Viewer",
    );

    // Generate tokens
    adminToken = generateToken(adminUser);
    employeeToken = generateToken(employeeUser);
    viewerToken = generateToken(viewerUser);
  });

  afterAll(async () => {
    // Clean up test data
    await run("DELETE FROM Users WHERE email LIKE '%@test.com'");
  });

  describe("GET /api/categories", () => {
    it("should return all categories for authenticated users", async () => {
      const response = await request(app)
        .get("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("categories");
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.categories.length).toBeGreaterThan(0);

      // Check category structure
      const category = response.body.categories[0];
      expect(category).toHaveProperty("id");
      expect(category).toHaveProperty("name");
      expect(category).toHaveProperty("createdAt");
      expect(category).toHaveProperty("documentCount");
    });

    it("should allow Employee to get categories", async () => {
      const response = await request(app)
        .get("/api/categories")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("categories");
    });

    it("should allow Viewer to get categories", async () => {
      const response = await request(app)
        .get("/api/categories")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("categories");
    });

    it("should return 401 for unauthenticated requests", async () => {
      const response = await request(app).get("/api/categories");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/categories", () => {
    it("should allow Admin to create a category", async () => {
      const response = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Test Category" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("category");
      expect(response.body.category.name).toBe("Test Category");
      expect(response.body.category).toHaveProperty("id");
      expect(response.body.category).toHaveProperty("createdAt");
      expect(response.body.category.documentCount).toBe(0);
    });

    it("should return 400 for missing category name", async () => {
      const response = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.message).toContain("required");
    });

    it("should return 400 for duplicate category name", async () => {
      // Create first category
      await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Duplicate Test" });

      // Try to create duplicate
      const response = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Duplicate Test" });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("already exists");
    });

    it("should return 403 for Employee trying to create category", async () => {
      const response = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({ name: "Employee Category" });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Insufficient permissions");
    });

    it("should return 403 for Viewer trying to create category", async () => {
      const response = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${viewerToken}`)
        .send({ name: "Viewer Category" });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Insufficient permissions");
    });

    it("should return 401 for unauthenticated requests", async () => {
      const response = await request(app)
        .post("/api/categories")
        .send({ name: "Unauth Category" });

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /api/categories/:id", () => {
    let testCategoryId;

    beforeEach(async () => {
      // Create a test category with unique name
      const uniqueName = `Update Test Category ${Date.now()}`;
      const response = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: uniqueName });

      testCategoryId = response.body.category.id;
    });

    it("should allow Admin to update a category", async () => {
      const response = await request(app)
        .put(`/api/categories/${testCategoryId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Updated Category Name" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("category");
      expect(response.body.category.name).toBe("Updated Category Name");
      expect(response.body.category.id).toBe(testCategoryId);
    });

    it("should return 400 for missing category name", async () => {
      const response = await request(app)
        .put(`/api/categories/${testCategoryId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("required");
    });

    it("should return 400 for invalid category ID", async () => {
      const response = await request(app)
        .put("/api/categories/invalid")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Updated Name" });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid category ID");
    });

    it("should return 404 for non-existent category", async () => {
      const response = await request(app)
        .put("/api/categories/99999")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Updated Name" });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });

    it("should return 403 for Employee trying to update category", async () => {
      const response = await request(app)
        .put(`/api/categories/${testCategoryId}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({ name: "Employee Update" });

      expect(response.status).toBe(403);
    });

    it("should return 403 for Viewer trying to update category", async () => {
      const response = await request(app)
        .put(`/api/categories/${testCategoryId}`)
        .set("Authorization", `Bearer ${viewerToken}`)
        .send({ name: "Viewer Update" });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /api/categories/:id", () => {
    let testCategoryId;

    beforeEach(async () => {
      // Create a test category with unique name
      const uniqueName = `Delete Test Category ${Date.now()}`;
      const response = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: uniqueName });

      testCategoryId = response.body.category.id;
    });

    it("should allow Admin to delete an empty category", async () => {
      const response = await request(app)
        .delete(`/api/categories/${testCategoryId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("deleted successfully");
    });

    it("should return 400 for invalid category ID", async () => {
      const response = await request(app)
        .delete("/api/categories/invalid")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid category ID");
    });

    it("should return 404 for non-existent category", async () => {
      const response = await request(app)
        .delete("/api/categories/99999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });

    it("should return 403 for Employee trying to delete category", async () => {
      const response = await request(app)
        .delete(`/api/categories/${testCategoryId}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
    });

    it("should return 403 for Viewer trying to delete category", async () => {
      const response = await request(app)
        .delete(`/api/categories/${testCategoryId}`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
    });
  });
});
