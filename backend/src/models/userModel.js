const db = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * User Model
 * Handles all database operations related to users
 */
const UserModel = {
  /**
   * Find a user by email
   * @param {string} email - User's email
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  findByEmail: async (email) => {
    try {
      const result = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  },

  /**
   * Find a user by ID
   * @param {number} id - User's ID
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  findById: async (id) => {
    try {
      const result = await db.query(
        'SELECT id, firstName, lastName, email, role, created_at FROM Users WHERE id = $1',
        [id]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  },

  /**
   * Create a new user
   * @param {Object} userData - User data (firstName, lastName, email, password, role)
   * @returns {Promise<Object>} - Created user object (excluding password)
   */
  create: async (userData) => {
    try {
      const { firstName, lastName, email, password, role } = userData;
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const result = await db.query(
        'INSERT INTO Users (firstName, lastName, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, firstName, lastName, email, role, created_at',
        [firstName, lastName, email, hashedPassword, role]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Update a user
   * @param {number} id - User's ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} - Updated user object
   */
  update: async (id, userData) => {
    try {
      const { firstName, lastName, email, role } = userData;
      
      const result = await db.query(
        'UPDATE Users SET firstName = $1, lastName = $2, email = $3, role = $4 WHERE id = $5 RETURNING id, firstName, lastName, email, role, created_at',
        [firstName, lastName, email, role, id]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  /**
   * Change user's password
   * @param {number} id - User's ID
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} - Success status
   */
  changePassword: async (id, newPassword) => {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      await db.query(
        'UPDATE Users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, id]
      );
      
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  /**
   * Verify user password
   * @param {string} password - Plaintext password to verify
   * @param {string} hashedPassword - Stored hashed password
   * @returns {Promise<boolean>} - True if password matches
   */
  verifyPassword: async (password, hashedPassword) => {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  },

  /**
   * Delete a user
   * @param {number} id - User's ID
   * @returns {Promise<boolean>} - Success status
   */
  delete: async (id) => {
    try {
      const result = await db.query('DELETE FROM Users WHERE id = $1 RETURNING id', [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  /**
   * Get all users with pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} - Object with users array and pagination info
   */
  getAll: async (page = 1, limit = 10) => {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      const countResult = await db.query('SELECT COUNT(*) FROM Users');
      const total = parseInt(countResult.rows[0].count);
      
      // Get users with pagination
      const result = await db.query(
        'SELECT id, firstName, lastName, email, role, created_at FROM Users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      
      return {
        users: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
};

module.exports = UserModel; 