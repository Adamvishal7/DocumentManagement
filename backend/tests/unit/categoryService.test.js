const categoryService = require("../../services/categoryService");
const { run, all } = require("../../models/database");
const { initializeSchema } = require("../../models/initDatabase");

describe("CategoryService", () => {
  beforeAll(async () => {
    // Initialize database schema once before all tests
    await initializeSchema();
  });

  beforeEach(async () => {
    // Clean up categories and documents before each test
    await run("DELETE FROM Documents");
    await run("DELETE FROM Categories");
    await run("DELETE FROM Users");
  });

  describe("createCategory", () => {
    it("should create a new category with valid name", async () => {
      const category = await categoryService.createCategory("Test Category");

      expect(category).toBeDefined();
      expect(category.id).toBeDefined();
      expect(category.name).toBe("Test Category");
      expect(category.documentCount).toBe(0);
      expect(category.createdAt).toBeDefined();
    });

    it("should trim whitespace from category name", async () => {
      const category = await categoryService.createCategory("  Trimmed  ");

      expect(category.name).toBe("Trimmed");
    });

    it("should throw error for empty category name", async () => {
      await expect(categoryService.createCategory("")).rejects.toThrow(
        "Category name is required",
      );
    });

    it("should throw error for whitespace-only category name", async () => {
      await expect(categoryService.createCategory("   ")).rejects.toThrow(
        "Category name is required",
      );
    });

    it("should throw error for duplicate category name", async () => {
      await categoryService.createCategory("Duplicate");

      await expect(categoryService.createCategory("Duplicate")).rejects.toThrow(
        "Category name already exists",
      );
    });
  });

  describe("getAllCategories", () => {
    it("should return empty array when no categories exist", async () => {
      const categories = await categoryService.getAllCategories();

      expect(categories).toEqual([]);
    });

    it("should return all categories with document counts", async () => {
      await categoryService.createCategory("Category A");
      await categoryService.createCategory("Category B");

      const categories = await categoryService.getAllCategories();

      expect(categories).toHaveLength(2);
      expect(categories[0].documentCount).toBe(0);
      expect(categories[1].documentCount).toBe(0);
    });

    it("should return categories sorted by name", async () => {
      await categoryService.createCategory("Zebra");
      await categoryService.createCategory("Apple");
      await categoryService.createCategory("Mango");

      const categories = await categoryService.getAllCategories();

      expect(categories[0].name).toBe("Apple");
      expect(categories[1].name).toBe("Mango");
      expect(categories[2].name).toBe("Zebra");
    });
  });

  describe("getCategoryById", () => {
    it("should return category by ID", async () => {
      const created = await categoryService.createCategory("Find Me");

      const found = await categoryService.getCategoryById(created.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
      expect(found.name).toBe("Find Me");
      expect(found.documentCount).toBe(0);
    });

    it("should return null for non-existent category", async () => {
      const found = await categoryService.getCategoryById(99999);

      expect(found).toBeNull();
    });
  });

  describe("updateCategory", () => {
    it("should update category name", async () => {
      const category = await categoryService.createCategory("Old Name");

      const updated = await categoryService.updateCategory(
        category.id,
        "New Name",
      );

      expect(updated).toBeDefined();
      expect(updated.name).toBe("New Name");
      expect(updated.id).toBe(category.id);
    });

    it("should trim whitespace from updated name", async () => {
      const category = await categoryService.createCategory("Original");

      const updated = await categoryService.updateCategory(
        category.id,
        "  Updated  ",
      );

      expect(updated.name).toBe("Updated");
    });

    it("should return null for non-existent category", async () => {
      const updated = await categoryService.updateCategory(99999, "New Name");

      expect(updated).toBeNull();
    });

    it("should throw error for empty name", async () => {
      const category = await categoryService.createCategory("Original");

      await expect(
        categoryService.updateCategory(category.id, ""),
      ).rejects.toThrow("Category name is required");
    });

    it("should throw error for duplicate name", async () => {
      const category1 = await categoryService.createCategory("Category 1");
      const category2 = await categoryService.createCategory("Category 2");

      await expect(
        categoryService.updateCategory(category2.id, "Category 1"),
      ).rejects.toThrow("Category name already exists");
    });
  });

  describe("validateCategoryEmpty", () => {
    it("should return true for category with no documents", async () => {
      const category = await categoryService.createCategory("Empty");

      const isEmpty = await categoryService.validateCategoryEmpty(category.id);

      expect(isEmpty).toBe(true);
    });

    it("should return false for category with documents", async () => {
      // Create a category
      const category = await categoryService.createCategory("Has Docs");

      // Create a user for the document
      await run(
        "INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        ["Test User", "test@example.com", "hash", "Employee"],
      );
      const users = await all("SELECT id FROM Users LIMIT 1");
      const userId = users[0].id;

      // Create a document in this category
      await run(
        "INSERT INTO Documents (document_name, category_id, uploaded_by) VALUES (?, ?, ?)",
        ["test.pdf", category.id, userId],
      );

      const isEmpty = await categoryService.validateCategoryEmpty(category.id);

      expect(isEmpty).toBe(false);
    });
  });

  describe("deleteCategory", () => {
    it("should delete empty category", async () => {
      const category = await categoryService.createCategory("To Delete");

      const deleted = await categoryService.deleteCategory(category.id);

      expect(deleted).toBe(true);

      const found = await categoryService.getCategoryById(category.id);
      expect(found).toBeNull();
    });

    it("should return false for non-existent category", async () => {
      const deleted = await categoryService.deleteCategory(99999);

      expect(deleted).toBe(false);
    });

    it("should throw error when deleting category with documents", async () => {
      // Create a category
      const category = await categoryService.createCategory("Has Docs");

      // Create a user for the document
      await run(
        "INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        ["Test User", "test@example.com", "hash", "Employee"],
      );
      const users = await all("SELECT id FROM Users LIMIT 1");
      const userId = users[0].id;

      // Create a document in this category
      await run(
        "INSERT INTO Documents (document_name, category_id, uploaded_by) VALUES (?, ?, ?)",
        ["test.pdf", category.id, userId],
      );

      await expect(categoryService.deleteCategory(category.id)).rejects.toThrow(
        "Cannot delete category with documents",
      );
    });
  });
});
