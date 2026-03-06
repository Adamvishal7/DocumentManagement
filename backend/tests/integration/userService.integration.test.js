const userService = require("../../services/userService");
const { initDatabase } = require("../../models/initDatabase");
const { run, closeDatabase } = require("../../models/database");
const path = require("path");
const fs = require("fs");

// Use in-memory database for integration tests
process.env.DB_PATH = ":memory:";

describe("UserService Integration Tests", () => {
  beforeAll(async () => {
    // Initialize database schema
    await initDatabase();
  });

  afterAll(async () => {
    // Close database connection
    closeDatabase();
  });

  beforeEach(async () => {
    // Clear users table before each test
    await run("DELETE FROM Users");
  });

  describe("createUser and authenticateUser", () => {
    it("should create user and authenticate with correct credentials", async () => {
      // Create user
      const user = await userService.createUser(
        "John Doe",
        "john@example.com",
        "password123",
        "Employee",
      );

      expect(user).toMatchObject({
        id: expect.any(Number),
        name: "John Doe",
        email: "john@example.com",
        role: "Employee",
      });

      // Authenticate with correct credentials
      const authenticatedUser = await userService.authenticateUser(
        "john@example.com",
        "password123",
      );

      expect(authenticatedUser).toMatchObject({
        id: user.id,
        name: "John Doe",
        email: "john@example.com",
        role: "Employee",
      });
    });

    it("should fail authentication with incorrect password", async () => {
      // Create user
      await userService.createUser(
        "John Doe",
        "john@example.com",
        "password123",
        "Employee",
      );

      // Authenticate with wrong password
      const authenticatedUser = await userService.authenticateUser(
        "john@example.com",
        "wrongPassword",
      );

      expect(authenticatedUser).toBeNull();
    });

    it("should fail authentication with non-existent email", async () => {
      const authenticatedUser = await userService.authenticateUser(
        "nonexistent@example.com",
        "password123",
      );

      expect(authenticatedUser).toBeNull();
    });
  });

  describe("getUserById", () => {
    it("should retrieve user by ID", async () => {
      const createdUser = await userService.createUser(
        "Jane Smith",
        "jane@example.com",
        "password123",
        "Admin",
      );

      const retrievedUser = await userService.getUserById(createdUser.id);

      expect(retrievedUser).toMatchObject({
        id: createdUser.id,
        name: "Jane Smith",
        email: "jane@example.com",
        role: "Admin",
      });
    });

    it("should return null for non-existent user ID", async () => {
      const user = await userService.getUserById(9999);

      expect(user).toBeNull();
    });
  });

  describe("getAllUsers", () => {
    it("should retrieve all users", async () => {
      // Create multiple users
      await userService.createUser(
        "User 1",
        "user1@example.com",
        "password123",
        "Admin",
      );
      await userService.createUser(
        "User 2",
        "user2@example.com",
        "password123",
        "Employee",
      );
      await userService.createUser(
        "User 3",
        "user3@example.com",
        "password123",
        "Viewer",
      );

      const users = await userService.getAllUsers();

      expect(users).toHaveLength(3);

      // Verify all users are present (order may vary)
      const userEmails = users.map((u) => u.email);
      expect(userEmails).toContain("user1@example.com");
      expect(userEmails).toContain("user2@example.com");
      expect(userEmails).toContain("user3@example.com");

      // Verify user data structure
      users.forEach((user) => {
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("role");
        expect(user).toHaveProperty("createdAt");
      });
    });

    it("should return empty array when no users exist", async () => {
      const users = await userService.getAllUsers();

      expect(users).toEqual([]);
    });
  });

  describe("updateUser", () => {
    it("should update user name", async () => {
      const user = await userService.createUser(
        "John Doe",
        "john@example.com",
        "password123",
        "Employee",
      );

      const updatedUser = await userService.updateUser(user.id, {
        name: "John Updated",
      });

      expect(updatedUser).toMatchObject({
        id: user.id,
        name: "John Updated",
        email: "john@example.com",
        role: "Employee",
      });
    });

    it("should update user email", async () => {
      const user = await userService.createUser(
        "John Doe",
        "john@example.com",
        "password123",
        "Employee",
      );

      const updatedUser = await userService.updateUser(user.id, {
        email: "john.new@example.com",
      });

      expect(updatedUser.email).toBe("john.new@example.com");
    });

    it("should update user role", async () => {
      const user = await userService.createUser(
        "John Doe",
        "john@example.com",
        "password123",
        "Employee",
      );

      const updatedUser = await userService.updateUser(user.id, {
        role: "Admin",
      });

      expect(updatedUser.role).toBe("Admin");
    });

    it("should update user password and allow authentication with new password", async () => {
      const user = await userService.createUser(
        "John Doe",
        "john@example.com",
        "oldPassword",
        "Employee",
      );

      // Update password
      await userService.updateUser(user.id, {
        password: "newPassword123",
      });

      // Old password should not work
      const authWithOld = await userService.authenticateUser(
        "john@example.com",
        "oldPassword",
      );
      expect(authWithOld).toBeNull();

      // New password should work
      const authWithNew = await userService.authenticateUser(
        "john@example.com",
        "newPassword123",
      );
      expect(authWithNew).toMatchObject({
        id: user.id,
        email: "john@example.com",
      });
    });

    it("should update multiple fields at once", async () => {
      const user = await userService.createUser(
        "John Doe",
        "john@example.com",
        "password123",
        "Employee",
      );

      const updatedUser = await userService.updateUser(user.id, {
        name: "John Updated",
        email: "john.updated@example.com",
        role: "Admin",
      });

      expect(updatedUser).toMatchObject({
        id: user.id,
        name: "John Updated",
        email: "john.updated@example.com",
        role: "Admin",
      });
    });

    it("should throw error for duplicate email", async () => {
      await userService.createUser(
        "User 1",
        "user1@example.com",
        "password123",
        "Employee",
      );
      const user2 = await userService.createUser(
        "User 2",
        "user2@example.com",
        "password123",
        "Employee",
      );

      await expect(
        userService.updateUser(user2.id, { email: "user1@example.com" }),
      ).rejects.toThrow("Email already exists");
    });

    it("should return null for non-existent user", async () => {
      const result = await userService.updateUser(9999, { name: "New Name" });

      expect(result).toBeNull();
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      const user = await userService.createUser(
        "John Doe",
        "john@example.com",
        "password123",
        "Employee",
      );

      const deleted = await userService.deleteUser(user.id);

      expect(deleted).toBe(true);

      // Verify user is deleted
      const retrievedUser = await userService.getUserById(user.id);
      expect(retrievedUser).toBeNull();
    });

    it("should return false for non-existent user", async () => {
      const deleted = await userService.deleteUser(9999);

      expect(deleted).toBe(false);
    });
  });

  describe("password hashing", () => {
    it("should store different hashes for same password (salting)", async () => {
      const user1 = await userService.createUser(
        "User 1",
        "user1@example.com",
        "samePassword",
        "Employee",
      );
      const user2 = await userService.createUser(
        "User 2",
        "user2@example.com",
        "samePassword",
        "Employee",
      );

      // Both should authenticate successfully
      const auth1 = await userService.authenticateUser(
        "user1@example.com",
        "samePassword",
      );
      const auth2 = await userService.authenticateUser(
        "user2@example.com",
        "samePassword",
      );

      expect(auth1).not.toBeNull();
      expect(auth2).not.toBeNull();
    });

    it("should never store plaintext passwords", async () => {
      const password = "mySecretPassword123";
      const user = await userService.createUser(
        "John Doe",
        "john@example.com",
        password,
        "Employee",
      );

      // Query database directly to check stored password
      const { get } = require("../../models/database");
      const dbUser = await get("SELECT password_hash FROM Users WHERE id = ?", [
        user.id,
      ]);

      // Password hash should not equal plaintext password
      expect(dbUser.password_hash).not.toBe(password);
      // Should be a bcrypt hash
      expect(dbUser.password_hash.startsWith("$2a$")).toBe(true);
    });
  });

  describe("role validation", () => {
    it("should accept valid roles", async () => {
      const admin = await userService.createUser(
        "Admin User",
        "admin@example.com",
        "password123",
        "Admin",
      );
      const employee = await userService.createUser(
        "Employee User",
        "employee@example.com",
        "password123",
        "Employee",
      );
      const viewer = await userService.createUser(
        "Viewer User",
        "viewer@example.com",
        "password123",
        "Viewer",
      );

      expect(admin.role).toBe("Admin");
      expect(employee.role).toBe("Employee");
      expect(viewer.role).toBe("Viewer");
    });

    it("should reject invalid roles on create", async () => {
      await expect(
        userService.createUser(
          "John Doe",
          "john@example.com",
          "password123",
          "InvalidRole",
        ),
      ).rejects.toThrow("Invalid role");
    });

    it("should reject invalid roles on update", async () => {
      const user = await userService.createUser(
        "John Doe",
        "john@example.com",
        "password123",
        "Employee",
      );

      await expect(
        userService.updateUser(user.id, { role: "SuperAdmin" }),
      ).rejects.toThrow("Invalid role");
    });
  });
});
