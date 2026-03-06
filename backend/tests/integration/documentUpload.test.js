const request = require("supertest");
const app = require("../../server");
const { initDatabase } = require("../../models/initDatabase");
const userService = require("../../services/userService");
const categoryService = require("../../services/categoryService");
const fs = require("fs").promises;
const path = require("path");

/**
 * Integration tests for document upload functionality
 * Tests Tasks 7 and 8 implementation
 */

describe("Document Upload Integration Tests", () => {
  let authToken;
  let userId;
  let categoryId;

  beforeAll(async () => {
    // Initialize database
    await initDatabase();

    // Create test user
    const user = await userService.createUser(
      "Test Employee",
      "employee@test.com",
      "password123",
      "Employee",
    );
    userId = user.id;

    // Login to get token
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "employee@test.com",
      password: "password123",
    });

    authToken = loginResponse.body.token;

    // Get a category
    const categories = await categoryService.getAllCategories();
    categoryId = categories[0].id;
  });

  describe("POST /api/documents/upload", () => {
    it("should upload a new document successfully", async () => {
      // Create a test PDF file buffer
      const testFileBuffer = Buffer.from("%PDF-1.4\n%Test PDF content");

      const response = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("categoryId", categoryId.toString())
        .attach("file", testFileBuffer, "test-document.pdf");

      expect(response.status).toBe(201);
      expect(response.body.message).toContain("uploaded successfully");
      expect(response.body.document).toBeDefined();
      expect(response.body.document.documentName).toBe("test-document.pdf");
      expect(response.body.document.currentVersion).toBe(1);
    });

    it("should reject upload without authentication", async () => {
      const testFileBuffer = Buffer.from("%PDF-1.4\n%Test PDF content");

      const response = await request(app)
        .post("/api/documents/upload")
        .field("categoryId", categoryId.toString())
        .attach("file", testFileBuffer, "test-document.pdf");

      expect(response.status).toBe(401);
    });

    it("should reject upload without category", async () => {
      const testFileBuffer = Buffer.from("%PDF-1.4\n%Test PDF content");

      const response = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("file", testFileBuffer, "test-document.pdf");

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("CATEGORY_REQUIRED");
    });

    it("should reject upload without file", async () => {
      const response = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("categoryId", categoryId.toString());

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("NO_FILE");
    });
  });

  describe("GET /api/documents", () => {
    it("should list documents with pagination", async () => {
      const response = await request(app)
        .get("/api/documents")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.documents).toBeDefined();
      expect(Array.isArray(response.body.documents)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.currentPage).toBe(1);
    });

    it("should reject unauthenticated requests", async () => {
      const response = await request(app).get("/api/documents");

      expect(response.status).toBe(401);
    });
  });

  describe("Document Download", () => {
    let documentId;

    beforeAll(async () => {
      // Upload a document to test download
      const testFileBuffer = Buffer.from("%PDF-1.4\n%Test PDF for download");

      const uploadResponse = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("categoryId", categoryId.toString())
        .attach("file", testFileBuffer, "download-test.pdf");

      documentId = uploadResponse.body.document.id;
    });

    it("should download a document", async () => {
      const response = await request(app)
        .get(`/api/documents/${documentId}/download`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-disposition"]).toContain(
        "download-test.pdf",
      );
      expect(Buffer.isBuffer(response.body)).toBe(true);
    });

    it("should return 404 for non-existent document", async () => {
      const response = await request(app)
        .get("/api/documents/99999/download")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe("DOCUMENT_NOT_FOUND");
    });
  });

  describe("Version Management", () => {
    let documentId;

    beforeAll(async () => {
      // Upload initial document
      const testFileBuffer = Buffer.from("%PDF-1.4\n%Version 1");

      const uploadResponse = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("categoryId", categoryId.toString())
        .attach("file", testFileBuffer, "versioned-doc.pdf");

      documentId = uploadResponse.body.document.id;
    });

    it("should upload a new version of existing document", async () => {
      const testFileBuffer = Buffer.from("%PDF-1.4\n%Version 2");

      const response = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("categoryId", categoryId.toString())
        .field("documentId", documentId.toString())
        .attach("file", testFileBuffer, "versioned-doc.pdf");

      expect(response.status).toBe(201);
      expect(response.body.message).toContain("New version uploaded");
      expect(response.body.document.currentVersion).toBe(2);
    });

    it("should retrieve version history", async () => {
      const response = await request(app)
        .get(`/api/documents/${documentId}/versions`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.versions).toBeDefined();
      expect(Array.isArray(response.body.versions)).toBe(true);
      expect(response.body.versions.length).toBeGreaterThanOrEqual(2);
    });

    it("should download specific version", async () => {
      const response = await request(app)
        .get(`/api/documents/${documentId}/versions/1/download`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-disposition"]).toContain(
        "versioned-doc.pdf",
      );
    });
  });

  describe("Document Deletion (Admin only)", () => {
    let adminToken;
    let documentId;

    beforeAll(async () => {
      // Create admin user
      const admin = await userService.createUser(
        "Test Admin",
        "admin@test.com",
        "password123",
        "Admin",
      );

      // Login as admin
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "admin@test.com",
        password: "password123",
      });

      adminToken = loginResponse.body.token;

      // Upload a document to delete
      const testFileBuffer = Buffer.from("%PDF-1.4\n%To be deleted");

      const uploadResponse = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("categoryId", categoryId.toString())
        .attach("file", testFileBuffer, "delete-test.pdf");

      documentId = uploadResponse.body.document.id;
    });

    it("should allow admin to delete document", async () => {
      const response = await request(app)
        .delete(`/api/documents/${documentId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("deleted successfully");
    });

    it("should reject non-admin deletion", async () => {
      // Upload another document
      const testFileBuffer = Buffer.from("%PDF-1.4\n%Employee cannot delete");

      const uploadResponse = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("categoryId", categoryId.toString())
        .attach("file", testFileBuffer, "no-delete.pdf");

      const docId = uploadResponse.body.document.id;

      // Try to delete as employee
      const response = await request(app)
        .delete(`/api/documents/${docId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });
});
