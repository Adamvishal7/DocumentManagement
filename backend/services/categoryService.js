const { run, get, all } = require("../models/database");

/**
 * Get all categories with document counts
 * @returns {Promise<Array>} Array of category objects with document counts
 */
async function getAllCategories() {
  try {
    const categories = await all(
      `SELECT 
        c.id, 
        c.category_name, 
        c.created_at,
        COUNT(d.id) as documentCount
      FROM Categories c
      LEFT JOIN Documents d ON c.id = d.category_id
      GROUP BY c.id, c.category_name, c.created_at
      ORDER BY c.category_name ASC`,
    );

    return categories.map((category) => ({
      id: category.id,
      name: category.category_name,
      createdAt: category.created_at,
      documentCount: category.documentCount,
    }));
  } catch (error) {
    throw error;
  }
}

/**
 * Get category by ID
 * @param {number} id - Category ID
 * @returns {Promise<Object|null>} Category object or null if not found
 */
async function getCategoryById(id) {
  try {
    const category = await get(
      `SELECT 
        c.id, 
        c.category_name, 
        c.created_at,
        COUNT(d.id) as documentCount
      FROM Categories c
      LEFT JOIN Documents d ON c.id = d.category_id
      WHERE c.id = ?
      GROUP BY c.id, c.category_name, c.created_at`,
      [id],
    );

    if (!category) {
      return null;
    }

    return {
      id: category.id,
      name: category.category_name,
      createdAt: category.created_at,
      documentCount: category.documentCount,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Create a new category
 * @param {string} name - Category name
 * @returns {Promise<Object>} Created category object
 */
async function createCategory(name) {
  try {
    // Validate category name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new Error(
        "Category name is required and must be a non-empty string",
      );
    }

    const trimmedName = name.trim();

    // Insert category into database
    const result = await run(
      "INSERT INTO Categories (category_name) VALUES (?)",
      [trimmedName],
    );

    // Return created category
    return {
      id: result.lastID,
      name: trimmedName,
      createdAt: new Date().toISOString(),
      documentCount: 0,
    };
  } catch (error) {
    // Handle unique constraint violation for category name
    if (error.message.includes("UNIQUE constraint failed")) {
      throw new Error("Category name already exists");
    }
    throw error;
  }
}

/**
 * Update category name
 * @param {number} id - Category ID
 * @param {string} name - New category name
 * @returns {Promise<Object|null>} Updated category object or null if not found
 */
async function updateCategory(id, name) {
  try {
    // Check if category exists
    const existingCategory = await getCategoryById(id);
    if (!existingCategory) {
      return null;
    }

    // Validate category name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new Error(
        "Category name is required and must be a non-empty string",
      );
    }

    const trimmedName = name.trim();

    // Update category
    await run("UPDATE Categories SET category_name = ? WHERE id = ?", [
      trimmedName,
      id,
    ]);

    // Return updated category
    return await getCategoryById(id);
  } catch (error) {
    // Handle unique constraint violation for category name
    if (error.message.includes("UNIQUE constraint failed")) {
      throw new Error("Category name already exists");
    }
    throw error;
  }
}

/**
 * Validate that a category is empty (has no documents)
 * @param {number} id - Category ID
 * @returns {Promise<boolean>} True if category is empty, false if it has documents
 */
async function validateCategoryEmpty(id) {
  try {
    const result = await get(
      "SELECT COUNT(*) as count FROM Documents WHERE category_id = ?",
      [id],
    );

    return result.count === 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a category
 * @param {number} id - Category ID
 * @returns {Promise<boolean>} True if category was deleted, false if not found
 * @throws {Error} If category contains documents
 */
async function deleteCategory(id) {
  try {
    // Check if category exists
    const category = await getCategoryById(id);
    if (!category) {
      return false;
    }

    // Validate category is empty
    const isEmpty = await validateCategoryEmpty(id);
    if (!isEmpty) {
      throw new Error(
        "Cannot delete category with documents. Please remove or reassign all documents first.",
      );
    }

    // Delete category
    const result = await run("DELETE FROM Categories WHERE id = ?", [id]);

    return result.changes > 0;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  validateCategoryEmpty,
};
