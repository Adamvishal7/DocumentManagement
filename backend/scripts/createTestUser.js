const { createUser } = require("../services/userService");
const { initDatabase } = require("../models/initDatabase");

async function createTestUsers() {
  try {
    console.log("Initializing database...");
    await initDatabase();

    console.log("\nCreating test users...");

    // Create Admin user
    try {
      const admin = await createUser(
        "Admin User",
        "admin@test.com",
        "admin123",
        "Admin",
      );
      console.log("✓ Admin user created:", admin.email);
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("✓ Admin user already exists: admin@test.com");
      } else {
        throw error;
      }
    }

    // Create Employee user
    try {
      const employee = await createUser(
        "Employee User",
        "employee@test.com",
        "employee123",
        "Employee",
      );
      console.log("✓ Employee user created:", employee.email);
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("✓ Employee user already exists: employee@test.com");
      } else {
        throw error;
      }
    }

    // Create Viewer user
    try {
      const viewer = await createUser(
        "Viewer User",
        "viewer@test.com",
        "viewer123",
        "Viewer",
      );
      console.log("✓ Viewer user created:", viewer.email);
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("✓ Viewer user already exists: viewer@test.com");
      } else {
        throw error;
      }
    }

    console.log("\n=== Test Users Created Successfully ===");
    console.log("\nYou can now log in with:");
    console.log("  Admin:    admin@test.com / admin123");
    console.log("  Employee: employee@test.com / employee123");
    console.log("  Viewer:   viewer@test.com / viewer123");

    process.exit(0);
  } catch (error) {
    console.error("Error creating test users:", error);
    process.exit(1);
  }
}

createTestUsers();
