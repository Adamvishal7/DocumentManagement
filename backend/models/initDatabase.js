const fs = require("fs");
const path = require("path");
const { getDatabase, run, all } = require("./database");

/**
 * Initialize database schema from SQL file
 * @returns {Promise<void>}
 */
async function initializeSchema() {
  try {
    console.log("Initializing database schema...");

    // Read schema SQL file
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    // Split SQL statements by semicolon and execute each
    const statements = schemaSql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      await run(statement);
    }

    console.log("Database schema initialized successfully");
  } catch (error) {
    console.error("Error initializing schema:", error.message);
    throw error;
  }
}

/**
 * Seed default categories
 * @returns {Promise<void>}
 */
async function seedDefaultCategories() {
  try {
    console.log("Seeding default categories...");

    const defaultCategories = [
      "HR Documents",
      "Finance",
      "Legal",
      "Projects",
      "Reports",
    ];

    for (const categoryName of defaultCategories) {
      // Check if category already exists
      const existing = await all(
        "SELECT id FROM Categories WHERE category_name = ?",
        [categoryName],
      );

      if (existing.length === 0) {
        await run("INSERT INTO Categories (category_name) VALUES (?)", [
          categoryName,
        ]);
        console.log(`  - Created category: ${categoryName}`);
      } else {
        console.log(`  - Category already exists: ${categoryName}`);
      }
    }

    console.log("Default categories seeded successfully");
  } catch (error) {
    console.error("Error seeding categories:", error.message);
    throw error;
  }
}

/**
 * Verify database schema integrity
 * @returns {Promise<boolean>}
 */
async function verifySchema() {
  try {
    console.log("Verifying database schema...");

    const requiredTables = [
      "Users",
      "Categories",
      "Documents",
      "Document_Versions",
      "Activity_Log",
    ];

    // Check if all required tables exist
    const tables = await all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    );

    const tableNames = tables.map((t) => t.name);

    for (const tableName of requiredTables) {
      if (!tableNames.includes(tableName)) {
        console.error(`  ✗ Missing table: ${tableName}`);
        return false;
      }
      console.log(`  ✓ Table exists: ${tableName}`);
    }

    // Verify foreign key constraints are enabled
    const fkStatus = await all("PRAGMA foreign_keys");
    if (fkStatus[0].foreign_keys !== 1) {
      console.error("  ✗ Foreign key constraints are not enabled");
      return false;
    }
    console.log("  ✓ Foreign key constraints enabled");

    console.log("Database schema verification completed successfully");
    return true;
  } catch (error) {
    console.error("Error verifying schema:", error.message);
    throw error;
  }
}

/**
 * Run database migrations
 * @returns {Promise<void>}
 */
async function runMigrations() {
  try {
    console.log("Running database migrations...");

    // Check if file_size column exists in Document_Versions table
    const tableInfo = await all("PRAGMA table_info(Document_Versions)");
    const hasFileSizeColumn = tableInfo.some((col) => col.name === "file_size");

    if (!hasFileSizeColumn) {
      console.log("  - Adding file_size column to Document_Versions table");
      await run(
        "ALTER TABLE Document_Versions ADD COLUMN file_size INTEGER DEFAULT 0",
      );
      console.log("  ✓ file_size column added successfully");
    } else {
      console.log("  ✓ file_size column already exists");
    }

    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error.message);
    throw error;
  }
}

/**
 * Initialize database with schema and default data
 * @returns {Promise<void>}
 */
async function initDatabase() {
  try {
    console.log("=== Database Initialization Started ===");

    // Initialize database connection
    getDatabase();

    // Create schema
    await initializeSchema();

    // Run migrations
    await runMigrations();

    // Verify schema
    const isValid = await verifySchema();
    if (!isValid) {
      throw new Error("Database schema verification failed");
    }

    // Seed default categories
    await seedDefaultCategories();

    console.log("=== Database Initialization Completed ===");
  } catch (error) {
    console.error("=== Database Initialization Failed ===");
    console.error(error);
    throw error;
  }
}

module.exports = {
  initDatabase,
  initializeSchema,
  seedDefaultCategories,
  verifySchema,
};
