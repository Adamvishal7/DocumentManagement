const { getDatabase, all, closeDatabase } = require("../models/database");
const { initDatabase, verifySchema } = require("../models/initDatabase");

describe("Database Initialization", () => {
  beforeAll(async () => {
    // Set test database path
    process.env.DB_PATH = ":memory:";
    await initDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  describe("Schema Verification", () => {
    test("should have all required tables", async () => {
      const tables = await all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      );

      const tableNames = tables.map((t) => t.name);

      expect(tableNames).toContain("Users");
      expect(tableNames).toContain("Categories");
      expect(tableNames).toContain("Documents");
      expect(tableNames).toContain("Document_Versions");
      expect(tableNames).toContain("Activity_Log");
    });

    test("should have foreign key constraints enabled", async () => {
      const result = await all("PRAGMA foreign_keys");
      expect(result[0].foreign_keys).toBe(1);
    });

    test("should verify schema successfully", async () => {
      const isValid = await verifySchema();
      expect(isValid).toBe(true);
    });
  });

  describe("Users Table", () => {
    test("should have correct schema", async () => {
      const columns = await all("PRAGMA table_info(Users)");
      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("name");
      expect(columnNames).toContain("email");
      expect(columnNames).toContain("password_hash");
      expect(columnNames).toContain("role");
      expect(columnNames).toContain("created_at");
    });

    test("should have email index", async () => {
      const indexes = await all("PRAGMA index_list(Users)");
      const indexNames = indexes.map((i) => i.name);

      expect(indexNames).toContain("idx_users_email");
    });

    test("should enforce role constraint", async () => {
      const columns = await all("PRAGMA table_info(Users)");
      const roleColumn = columns.find((c) => c.name === "role");

      expect(roleColumn).toBeDefined();
      expect(roleColumn.notnull).toBe(1);
    });
  });

  describe("Categories Table", () => {
    test("should have correct schema", async () => {
      const columns = await all("PRAGMA table_info(Categories)");
      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("category_name");
      expect(columnNames).toContain("created_at");
    });

    test("should have category_name index", async () => {
      const indexes = await all("PRAGMA index_list(Categories)");
      const indexNames = indexes.map((i) => i.name);

      expect(indexNames).toContain("idx_categories_name");
    });

    test("should have default categories seeded", async () => {
      const categories = await all("SELECT category_name FROM Categories");
      const categoryNames = categories.map((c) => c.category_name);

      expect(categoryNames).toContain("HR Documents");
      expect(categoryNames).toContain("Finance");
      expect(categoryNames).toContain("Legal");
      expect(categoryNames).toContain("Projects");
      expect(categoryNames).toContain("Reports");
    });
  });

  describe("Documents Table", () => {
    test("should have correct schema", async () => {
      const columns = await all("PRAGMA table_info(Documents)");
      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("document_name");
      expect(columnNames).toContain("category_id");
      expect(columnNames).toContain("uploaded_by");
      expect(columnNames).toContain("upload_date");
      expect(columnNames).toContain("current_version");
    });

    test("should have all required indexes", async () => {
      const indexes = await all("PRAGMA index_list(Documents)");
      const indexNames = indexes.map((i) => i.name);

      expect(indexNames).toContain("idx_documents_name");
      expect(indexNames).toContain("idx_documents_category");
      expect(indexNames).toContain("idx_documents_upload_date");
      expect(indexNames).toContain("idx_documents_uploader");
    });

    test("should have foreign key constraints", async () => {
      const foreignKeys = await all("PRAGMA foreign_key_list(Documents)");

      expect(foreignKeys.length).toBeGreaterThanOrEqual(2);

      const categoryFK = foreignKeys.find((fk) => fk.table === "Categories");
      const userFK = foreignKeys.find((fk) => fk.table === "Users");

      expect(categoryFK).toBeDefined();
      expect(categoryFK.on_delete).toBe("RESTRICT");

      expect(userFK).toBeDefined();
      expect(userFK.on_delete).toBe("CASCADE");
    });
  });

  describe("Document_Versions Table", () => {
    test("should have correct schema", async () => {
      const columns = await all("PRAGMA table_info(Document_Versions)");
      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("document_id");
      expect(columnNames).toContain("version_number");
      expect(columnNames).toContain("file_path");
      expect(columnNames).toContain("uploaded_at");
    });

    test("should have document_id index", async () => {
      const indexes = await all("PRAGMA index_list(Document_Versions)");
      const indexNames = indexes.map((i) => i.name);

      expect(indexNames).toContain("idx_versions_document");
    });

    test("should have unique constraint on document_id and version_number", async () => {
      const indexes = await all("PRAGMA index_list(Document_Versions)");

      // SQLite creates an index for UNIQUE constraints
      const uniqueIndex = indexes.find((i) => i.unique === 1);
      expect(uniqueIndex).toBeDefined();
    });

    test("should have foreign key constraint to Documents", async () => {
      const foreignKeys = await all(
        "PRAGMA foreign_key_list(Document_Versions)",
      );

      expect(foreignKeys.length).toBeGreaterThanOrEqual(1);

      const documentFK = foreignKeys.find((fk) => fk.table === "Documents");
      expect(documentFK).toBeDefined();
      expect(documentFK.on_delete).toBe("CASCADE");
    });
  });

  describe("Activity_Log Table", () => {
    test("should have correct schema", async () => {
      const columns = await all("PRAGMA table_info(Activity_Log)");
      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("user_id");
      expect(columnNames).toContain("action");
      expect(columnNames).toContain("resource_type");
      expect(columnNames).toContain("resource_name");
      expect(columnNames).toContain("timestamp");
    });

    test("should have all required indexes", async () => {
      const indexes = await all("PRAGMA index_list(Activity_Log)");
      const indexNames = indexes.map((i) => i.name);

      expect(indexNames).toContain("idx_activity_user");
      expect(indexNames).toContain("idx_activity_action");
      expect(indexNames).toContain("idx_activity_timestamp");
    });

    test("should have foreign key constraint to Users", async () => {
      const foreignKeys = await all("PRAGMA foreign_key_list(Activity_Log)");

      expect(foreignKeys.length).toBeGreaterThanOrEqual(1);

      const userFK = foreignKeys.find((fk) => fk.table === "Users");
      expect(userFK).toBeDefined();
      expect(userFK.on_delete).toBe("CASCADE");
    });
  });
});
