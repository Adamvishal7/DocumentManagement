const bcrypt = require("bcryptjs");
const { run, get, all } = require("../models/database");

// Salt rounds for bcrypt hashing (as specified in requirements)
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Create a new user with hashed password
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @param {string} password - Plain text password
 * @param {string} role - User's role (Admin, Employee, Viewer)
 * @returns {Promise<Object>} Created user object (without password hash)
 */
async function createUser(name, email, password, role) {
  try {
    // Validate role
    const validRoles = ["Admin", "Employee", "Viewer"];
    if (!validRoles.includes(role)) {
      throw new Error(
        `Invalid role: ${role}. Must be one of: ${validRoles.join(", ")}`,
      );
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Insert user into database
    const result = await run(
      "INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, email, passwordHash, role],
    );

    // Return user object without password hash
    return {
      id: result.lastID,
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    // Handle unique constraint violation for email
    if (error.message.includes("UNIQUE constraint failed")) {
      throw new Error("Email already exists");
    }
    throw error;
  }
}

/**
 * Authenticate a user with email and password
 * @param {string} email - User's email
 * @param {string} password - Plain text password
 * @returns {Promise<Object|null>} User object if authenticated, null otherwise
 */
async function authenticateUser(email, password) {
  try {
    // Find user by email
    const user = await get("SELECT * FROM Users WHERE email = ?", [email]);

    if (!user) {
      return null;
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return null;
    }

    // Return user object without password hash
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUserById(id) {
  try {
    const user = await get("SELECT * FROM Users WHERE id = ?", [id]);

    if (!user) {
      return null;
    }

    // Return user object without password hash
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get all users
 * @returns {Promise<Array>} Array of user objects
 */
async function getAllUsers() {
  try {
    const users = await all("SELECT * FROM Users ORDER BY created_at DESC");

    // Return users without password hashes
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    }));
  } catch (error) {
    throw error;
  }
}

/**
 * Update user details
 * @param {number} id - User ID
 * @param {Object} updates - Object containing fields to update (name, email, role, password)
 * @returns {Promise<Object|null>} Updated user object or null if not found
 */
async function updateUser(id, updates) {
  try {
    // Check if user exists
    const existingUser = await getUserById(id);
    if (!existingUser) {
      return null;
    }

    // Build update query dynamically based on provided fields
    const allowedFields = ["name", "email", "role", "password"];
    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === "password") {
          // Hash password if updating
          updateFields.push("password_hash = ?");
          updateValues.push(await hashPassword(value));
        } else if (key === "role") {
          // Validate role
          const validRoles = ["Admin", "Employee", "Viewer"];
          if (!validRoles.includes(value)) {
            throw new Error(
              `Invalid role: ${value}. Must be one of: ${validRoles.join(", ")}`,
            );
          }
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }
    }

    if (updateFields.length === 0) {
      // No valid fields to update
      return existingUser;
    }

    // Add user ID to values array
    updateValues.push(id);

    // Execute update
    await run(
      `UPDATE Users SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues,
    );

    // Return updated user
    return await getUserById(id);
  } catch (error) {
    // Handle unique constraint violation for email
    if (error.message.includes("UNIQUE constraint failed")) {
      throw new Error("Email already exists");
    }
    throw error;
  }
}

/**
 * Delete a user
 * @param {number} id - User ID
 * @returns {Promise<boolean>} True if user was deleted, false if not found
 */
async function deleteUser(id) {
  try {
    const result = await run("DELETE FROM Users WHERE id = ?", [id]);

    return result.changes > 0;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  createUser,
  authenticateUser,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
};
