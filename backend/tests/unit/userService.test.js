const userService = require("../../services/userService");
const { run, get, all } = require("../../models/database");
const bcrypt = require("bcryptjs");

// Mock the database module
jest.mock("../../models/database");

describe("UserService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("should hash a password using bcrypt", async () => {
      const password = "testPassword123";
      const hash = await userService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith("$2a$")).toBe(true); // bcrypt hash format
    });

    it("should produce different hashes for the same password (salting)", async () => {
      const password = "testPassword123";
      const hash1 = await userService.hashPassword(password);
      const hash2 = await userService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should return true for correct password", async () => {
      const password = "testPassword123";
      const hash = await bcrypt.hash(password, 10);

      const result = await userService.verifyPassword(password, hash);

      expect(result).toBe(true);
    });

    it("should return false for incorrect password", async () => {
      const password = "testPassword123";
      const wrongPassword = "wrongPassword";
      const hash = await bcrypt.hash(password, 10);

      const result = await userService.verifyPassword(wrongPassword, hash);

      expect(result).toBe(false);
    });
  });

  describe("createUser", () => {
    it("should create a user with hashed password", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "Employee",
      };

      run.mockResolvedValue({ lastID: 1, changes: 1 });

      const user = await userService.createUser(
        userData.name,
        userData.email,
        userData.password,
        userData.role,
      );

      expect(user).toEqual({
        id: 1,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        createdAt: expect.any(String),
      });

      expect(run).toHaveBeenCalledWith(
        "INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        [userData.name, userData.email, expect.any(String), userData.role],
      );

      // Verify password was hashed
      const hashedPassword = run.mock.calls[0][1][2];
      expect(hashedPassword).not.toBe(userData.password);
      expect(hashedPassword.startsWith("$2a$")).toBe(true);
    });

    it("should throw error for invalid role", async () => {
      await expect(
        userService.createUser(
          "John Doe",
          "john@example.com",
          "password123",
          "InvalidRole",
        ),
      ).rejects.toThrow("Invalid role");
    });

    it("should throw error for duplicate email", async () => {
      run.mockRejectedValue(new Error("UNIQUE constraint failed: Users.email"));

      await expect(
        userService.createUser(
          "John Doe",
          "john@example.com",
          "password123",
          "Employee",
        ),
      ).rejects.toThrow("Email already exists");
    });
  });

  describe("authenticateUser", () => {
    it("should return user object for valid credentials", async () => {
      const password = "password123";
      const hash = await bcrypt.hash(password, 10);

      const mockUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password_hash: hash,
        role: "Employee",
        created_at: "2024-01-01T00:00:00.000Z",
      };

      get.mockResolvedValue(mockUser);

      const user = await userService.authenticateUser(
        "john@example.com",
        password,
      );

      expect(user).toEqual({
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        role: "Employee",
        createdAt: "2024-01-01T00:00:00.000Z",
      });

      expect(get).toHaveBeenCalledWith("SELECT * FROM Users WHERE email = ?", [
        "john@example.com",
      ]);
    });

    it("should return null for non-existent user", async () => {
      get.mockResolvedValue(null);

      const user = await userService.authenticateUser(
        "nonexistent@example.com",
        "password123",
      );

      expect(user).toBeNull();
    });

    it("should return null for incorrect password", async () => {
      const password = "password123";
      const hash = await bcrypt.hash(password, 10);

      const mockUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password_hash: hash,
        role: "Employee",
        created_at: "2024-01-01T00:00:00.000Z",
      };

      get.mockResolvedValue(mockUser);

      const user = await userService.authenticateUser(
        "john@example.com",
        "wrongPassword",
      );

      expect(user).toBeNull();
    });
  });

  describe("getUserById", () => {
    it("should return user object without password hash", async () => {
      const mockUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password_hash: "hashedPassword",
        role: "Employee",
        created_at: "2024-01-01T00:00:00.000Z",
      };

      get.mockResolvedValue(mockUser);

      const user = await userService.getUserById(1);

      expect(user).toEqual({
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        role: "Employee",
        createdAt: "2024-01-01T00:00:00.000Z",
      });

      expect(get).toHaveBeenCalledWith("SELECT * FROM Users WHERE id = ?", [1]);
    });

    it("should return null for non-existent user", async () => {
      get.mockResolvedValue(null);

      const user = await userService.getUserById(999);

      expect(user).toBeNull();
    });
  });

  describe("getAllUsers", () => {
    it("should return all users without password hashes", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          password_hash: "hash1",
          role: "Employee",
          created_at: "2024-01-01T00:00:00.000Z",
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          password_hash: "hash2",
          role: "Admin",
          created_at: "2024-01-02T00:00:00.000Z",
        },
      ];

      all.mockResolvedValue(mockUsers);

      const users = await userService.getAllUsers();

      expect(users).toEqual([
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          role: "Employee",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          role: "Admin",
          createdAt: "2024-01-02T00:00:00.000Z",
        },
      ]);

      expect(all).toHaveBeenCalledWith(
        "SELECT * FROM Users ORDER BY created_at DESC",
      );
    });

    it("should return empty array when no users exist", async () => {
      all.mockResolvedValue([]);

      const users = await userService.getAllUsers();

      expect(users).toEqual([]);
    });
  });

  describe("updateUser", () => {
    it("should update user name", async () => {
      const existingUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        role: "Employee",
        created_at: "2024-01-01T00:00:00.000Z",
      };

      const updatedUser = {
        ...existingUser,
        name: "John Updated",
      };

      get.mockResolvedValueOnce({
        ...existingUser,
        password_hash: "hash",
      });
      run.mockResolvedValue({ changes: 1 });
      get.mockResolvedValueOnce({
        ...updatedUser,
        password_hash: "hash",
      });

      const result = await userService.updateUser(1, { name: "John Updated" });

      expect(result.name).toBe("John Updated");
      expect(run).toHaveBeenCalledWith(
        "UPDATE Users SET name = ? WHERE id = ?",
        ["John Updated", 1],
      );
    });

    it("should update user password with hashing", async () => {
      const existingUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password_hash: "oldHash",
        role: "Employee",
        created_at: "2024-01-01T00:00:00.000Z",
      };

      get.mockResolvedValueOnce(existingUser);
      run.mockResolvedValue({ changes: 1 });
      get.mockResolvedValueOnce(existingUser);

      await userService.updateUser(1, { password: "newPassword123" });

      expect(run).toHaveBeenCalledWith(
        "UPDATE Users SET password_hash = ? WHERE id = ?",
        [expect.any(String), 1],
      );

      // Verify password was hashed
      const hashedPassword = run.mock.calls[0][1][0];
      expect(hashedPassword).not.toBe("newPassword123");
      expect(hashedPassword.startsWith("$2a$")).toBe(true);
    });

    it("should update user role", async () => {
      const existingUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password_hash: "hash",
        role: "Employee",
        created_at: "2024-01-01T00:00:00.000Z",
      };

      get.mockResolvedValueOnce(existingUser);
      run.mockResolvedValue({ changes: 1 });
      get.mockResolvedValueOnce({ ...existingUser, role: "Admin" });

      const result = await userService.updateUser(1, { role: "Admin" });

      expect(run).toHaveBeenCalledWith(
        "UPDATE Users SET role = ? WHERE id = ?",
        ["Admin", 1],
      );
    });

    it("should throw error for invalid role", async () => {
      const existingUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password_hash: "hash",
        role: "Employee",
        created_at: "2024-01-01T00:00:00.000Z",
      };

      get.mockResolvedValue(existingUser);

      await expect(
        userService.updateUser(1, { role: "InvalidRole" }),
      ).rejects.toThrow("Invalid role");
    });

    it("should return null for non-existent user", async () => {
      get.mockResolvedValue(null);

      const result = await userService.updateUser(999, { name: "New Name" });

      expect(result).toBeNull();
    });

    it("should update multiple fields at once", async () => {
      const existingUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password_hash: "hash",
        role: "Employee",
        created_at: "2024-01-01T00:00:00.000Z",
      };

      get.mockResolvedValueOnce(existingUser);
      run.mockResolvedValue({ changes: 1 });
      get.mockResolvedValueOnce({
        ...existingUser,
        name: "John Updated",
        email: "john.updated@example.com",
      });

      await userService.updateUser(1, {
        name: "John Updated",
        email: "john.updated@example.com",
      });

      expect(run).toHaveBeenCalledWith(
        "UPDATE Users SET name = ?, email = ? WHERE id = ?",
        ["John Updated", "john.updated@example.com", 1],
      );
    });

    it("should throw error for duplicate email", async () => {
      const existingUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password_hash: "hash",
        role: "Employee",
        created_at: "2024-01-01T00:00:00.000Z",
      };

      get.mockResolvedValue(existingUser);
      run.mockRejectedValue(new Error("UNIQUE constraint failed: Users.email"));

      await expect(
        userService.updateUser(1, { email: "existing@example.com" }),
      ).rejects.toThrow("Email already exists");
    });
  });

  describe("deleteUser", () => {
    it("should delete user and return true", async () => {
      run.mockResolvedValue({ changes: 1 });

      const result = await userService.deleteUser(1);

      expect(result).toBe(true);
      expect(run).toHaveBeenCalledWith("DELETE FROM Users WHERE id = ?", [1]);
    });

    it("should return false for non-existent user", async () => {
      run.mockResolvedValue({ changes: 0 });

      const result = await userService.deleteUser(999);

      expect(result).toBe(false);
    });
  });
});
