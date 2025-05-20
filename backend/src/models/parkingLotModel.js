const db = require('../config/db');

/**
 * ParkingLot Model
 * Handles all database operations related to parking lots
 */
const ParkingLotModel = {
  /**
   * Find a parking lot by ID
   * @param {number} id - Parking lot ID
   * @returns {Promise<Object|null>} - Parking lot object or null if not found
   */
  findById: async (id) => {
    try {
      const result = await db.query('SELECT * FROM ParkingLots WHERE id = $1', [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding parking lot by id:', error);
      throw error;
    }
  },

  /**
   * Find a parking lot by code
   * @param {string} code - Parking lot code
   * @returns {Promise<Object|null>} - Parking lot object or null if not found
   */
  findByCode: async (code) => {
    try {
      const result = await db.query('SELECT * FROM ParkingLots WHERE code = $1', [code]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding parking lot by code:', error);
      throw error;
    }
  },

  /**
   * Create a new parking lot
   * @param {Object} parkingLotData - Parking lot data
   * @returns {Promise<Object>} - Created parking lot object
   */
  create: async (parkingLotData) => {
    try {
      const { code, name, total_spaces, location, fee_per_hour } = parkingLotData;
      
      // Set available_spaces equal to total_spaces initially
      const available_spaces = total_spaces;
      
      const result = await db.query(
        'INSERT INTO ParkingLots (code, name, total_spaces, available_spaces, location, fee_per_hour) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [code, name, total_spaces, available_spaces, location, fee_per_hour]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating parking lot:', error);
      throw error;
    }
  },

  /**
   * Update a parking lot
   * @param {number} id - Parking lot ID
   * @param {Object} parkingLotData - Parking lot data to update
   * @returns {Promise<Object>} - Updated parking lot object
   */
  update: async (id, parkingLotData) => {
    try {
      // First get the current parking lot data to calculate the new available spaces
      const existingLot = await ParkingLotModel.findById(id);
      
      if (!existingLot) {
        throw new Error('Parking lot not found');
      }
      
      const { name, total_spaces, location, fee_per_hour } = parkingLotData;
      
      // Calculate new available spaces based on change in total_spaces
      const oldTotalSpaces = existingLot.total_spaces;
      const oldAvailableSpaces = existingLot.available_spaces;
      
      // If total_spaces is being changed, adjust available_spaces proportionally
      let newAvailableSpaces = oldAvailableSpaces;
      if (total_spaces !== oldTotalSpaces) {
        const occupiedSpaces = oldTotalSpaces - oldAvailableSpaces;
        newAvailableSpaces = Math.max(0, total_spaces - occupiedSpaces);
      }
      
      const result = await db.query(
        'UPDATE ParkingLots SET name = $1, total_spaces = $2, available_spaces = $3, location = $4, fee_per_hour = $5 WHERE id = $6 RETURNING *',
        [name, total_spaces, newAvailableSpaces, location, fee_per_hour, id]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating parking lot:', error);
      throw error;
    }
  },

  /**
   * Delete a parking lot
   * @param {number} id - Parking lot ID
   * @returns {Promise<boolean>} - Success status
   */
  delete: async (id) => {
    try {
      // Check if there are active parking records
      const activeRecords = await db.query(
        'SELECT COUNT(*) FROM ParkingRecords WHERE parking_lot_id = $1 AND exit_time IS NULL',
        [id]
      );
      
      if (parseInt(activeRecords.rows[0].count) > 0) {
        throw new Error('Cannot delete parking lot with active parking records');
      }
      
      const result = await db.query('DELETE FROM ParkingLots WHERE id = $1 RETURNING id', [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting parking lot:', error);
      throw error;
    }
  },

  /**
   * Get all parking lots with pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} - Object with parking lots array and pagination info
   */
  getAll: async (page = 1, limit = 10) => {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      const countResult = await db.query('SELECT COUNT(*) FROM ParkingLots');
      const total = parseInt(countResult.rows[0].count);
      
      // Get parking lots with pagination
      const result = await db.query(
        'SELECT * FROM ParkingLots ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      
      return {
        parkingLots: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting all parking lots:', error);
      throw error;
    }
  },

  /**
   * Decrement available spaces for a parking lot
   * @param {number} id - Parking lot ID
   * @returns {Promise<Object>} - Updated parking lot
   */
  decrementAvailableSpaces: async (id) => {
    try {
      const result = await db.query(
        'UPDATE ParkingLots SET available_spaces = available_spaces - 1 WHERE id = $1 AND available_spaces > 0 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new Error('No available spaces or parking lot not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error decrementing available spaces:', error);
      throw error;
    }
  },

  /**
   * Increment available spaces for a parking lot
   * @param {number} id - Parking lot ID
   * @returns {Promise<Object>} - Updated parking lot
   */
  incrementAvailableSpaces: async (id) => {
    try {
      // Make sure we don't exceed total_spaces
      const result = await db.query(
        'UPDATE ParkingLots SET available_spaces = LEAST(available_spaces + 1, total_spaces) WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Parking lot not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error incrementing available spaces:', error);
      throw error;
    }
  }
};

module.exports = ParkingLotModel; 