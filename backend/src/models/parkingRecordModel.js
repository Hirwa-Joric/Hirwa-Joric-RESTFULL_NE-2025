const db = require('../config/db');
const ParkingLotModel = require('./parkingLotModel');

/**
 * ParkingRecord Model
 * Handles all database operations related to parking records
 */
const ParkingRecordModel = {
  /**
   * Find a parking record by ID
   * @param {number} id - Parking record ID
   * @returns {Promise<Object|null>} - Parking record object or null if not found
   */
  findById: async (id) => {
    try {
      const result = await db.query(
        `SELECT pr.*, pl.code as parking_lot_code, pl.name as parking_lot_name, pl.fee_per_hour
         FROM ParkingRecords pr 
         JOIN ParkingLots pl ON pr.parking_lot_id = pl.id 
         WHERE pr.id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const record = result.rows[0];
      
      // Calculate duration if entry and exit time exist
      if (record.entry_time && record.exit_time) {
        const entryTime = new Date(record.entry_time);
        const exitTime = new Date(record.exit_time);
        record.durationHours = Math.ceil((exitTime - entryTime) / (1000 * 60 * 60));
      }
      
      return record;
    } catch (error) {
      console.error('Error finding parking record by id:', error);
      throw error;
    }
  },

  /**
   * Create a new parking record (car entry)
   * @param {Object} recordData - Parking record data
   * @returns {Promise<Object>} - Created parking record and updated parking lot
   */
  createEntry: async (recordData) => {
    try {
      const { car_plate_number, parking_lot_id } = recordData;
      
      // Start a transaction
      await db.query('BEGIN');
      
      try {
        // Decrement available spaces in the parking lot
        const updatedParkingLot = await ParkingLotModel.decrementAvailableSpaces(parking_lot_id);
        
        // Create the parking record
        const newRecord = await db.query(
          'INSERT INTO ParkingRecords (car_plate_number, parking_lot_id, entry_time) VALUES ($1, $2, NOW()) RETURNING *',
          [car_plate_number, parking_lot_id]
        );
        
        // Commit the transaction
        await db.query('COMMIT');
        
        return {
          ticket: newRecord.rows[0],
          parkingLot: updatedParkingLot
        };
      } catch (error) {
        // Rollback in case of error
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error creating parking record entry:', error);
      throw error;
    }
  },

  /**
   * Record car exit and generate bill
   * @param {number} id - Parking record ID
   * @returns {Promise<Object>} - Updated parking record with bill details and updated parking lot
   */
  recordExit: async (id) => {
    try {
      // Find the parking record and check if it's valid for exit
      const recordResult = await db.query(
        'SELECT pr.*, pl.fee_per_hour, pl.id as lot_id FROM ParkingRecords pr JOIN ParkingLots pl ON pr.parking_lot_id = pl.id WHERE pr.id = $1',
        [id]
      );
      
      if (recordResult.rows.length === 0) {
        throw new Error('Parking record not found');
      }
      
      const parkingRecord = recordResult.rows[0];
      
      if (parkingRecord.exit_time !== null) {
        throw new Error('This car has already exited');
      }
      
      // Calculate duration and amount
      const currentTime = new Date();
      const entryTime = new Date(parkingRecord.entry_time);
      
      // Calculate duration in hours (rounded up - e.g., 1h 15m = 2h)
      const durationHours = Math.ceil((currentTime - entryTime) / (1000 * 60 * 60));
      
      // Calculate charged amount
      const chargedAmount = durationHours * parkingRecord.fee_per_hour;
      
      // Start a transaction
      await db.query('BEGIN');
      
      try {
        // Update parking record
        const updatedRecord = await db.query(
          'UPDATE ParkingRecords SET exit_time = NOW(), charged_amount = $1 WHERE id = $2 RETURNING *',
          [chargedAmount, id]
        );
        
        // Increment available spaces in the parking lot
        const updatedParkingLot = await ParkingLotModel.incrementAvailableSpaces(parkingRecord.lot_id);
        
        // Commit the transaction
        await db.query('COMMIT');
        
        return {
          bill: {
            ...updatedRecord.rows[0],
            durationHours,
            fee_per_hour: parkingRecord.fee_per_hour
          },
          parkingLot: updatedParkingLot
        };
      } catch (error) {
        // Rollback in case of error
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error recording parking exit:', error);
      throw error;
    }
  },

  /**
   * Get all parking records with pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} - Object with parking records array and pagination info
   */
  getAll: async (page = 1, limit = 10) => {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      const countResult = await db.query('SELECT COUNT(*) FROM ParkingRecords');
      const total = parseInt(countResult.rows[0].count);
      
      // Get parking records with pagination
      const parkingRecords = await db.query(
        `SELECT pr.*, pl.code as parking_lot_code, pl.name as parking_lot_name 
         FROM ParkingRecords pr 
         JOIN ParkingLots pl ON pr.parking_lot_id = pl.id 
         ORDER BY pr.created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      
      return {
        parkingRecords: parkingRecords.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting all parking records:', error);
      throw error;
    }
  },

  /**
   * Get report of outgoing cars between dates
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} - Object with outgoing cars data, summary and pagination info
   */
  getOutgoingCarsReport: async (startDate, endDate, page = 1, limit = 10) => {
    try {
      const offset = (page - 1) * limit;
      
      // Add time to endDate to include the entire day
      const queryEndDate = new Date(endDate);
      queryEndDate.setHours(23, 59, 59, 999);
      
      // Get total count and sum of charged amount
      const countAndSumResult = await db.query(
        `SELECT COUNT(*) as total, SUM(charged_amount) as total_amount
         FROM ParkingRecords
         WHERE exit_time IS NOT NULL
         AND exit_time BETWEEN $1 AND $2`,
        [startDate, queryEndDate]
      );
      
      const total = parseInt(countAndSumResult.rows[0].total);
      const totalAmount = parseFloat(countAndSumResult.rows[0].total_amount) || 0;
      
      // Get outgoing cars with pagination
      const outgoingCars = await db.query(
        `SELECT pr.*, pl.code as parking_lot_code, pl.name as parking_lot_name, pl.fee_per_hour
         FROM ParkingRecords pr
         JOIN ParkingLots pl ON pr.parking_lot_id = pl.id
         WHERE pr.exit_time IS NOT NULL
         AND pr.exit_time BETWEEN $1 AND $2
         ORDER BY pr.exit_time DESC
         LIMIT $3 OFFSET $4`,
        [startDate, queryEndDate, limit, offset]
      );
      
      // Calculate duration for each record
      const recordsWithDuration = outgoingCars.rows.map(record => {
        const entryTime = new Date(record.entry_time);
        const exitTime = new Date(record.exit_time);
        const durationHours = Math.ceil((exitTime - entryTime) / (1000 * 60 * 60));
        
        return {
          ...record,
          durationHours
        };
      });
      
      return {
        outgoingCars: recordsWithDuration,
        summary: {
          totalAmount,
          totalRecords: total
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting outgoing cars report:', error);
      throw error;
    }
  },

  /**
   * Get report of entered cars between dates
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} - Object with entered cars data, summary and pagination info
   */
  getEnteredCarsReport: async (startDate, endDate, page = 1, limit = 10) => {
    try {
      const offset = (page - 1) * limit;
      
      // Add time to endDate to include the entire day
      const queryEndDate = new Date(endDate);
      queryEndDate.setHours(23, 59, 59, 999);
      
      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as total
         FROM ParkingRecords
         WHERE entry_time BETWEEN $1 AND $2`,
        [startDate, queryEndDate]
      );
      
      const total = parseInt(countResult.rows[0].total);
      
      // Get entered cars with pagination
      const enteredCars = await db.query(
        `SELECT pr.*, pl.code as parking_lot_code, pl.name as parking_lot_name
         FROM ParkingRecords pr
         JOIN ParkingLots pl ON pr.parking_lot_id = pl.id
         WHERE pr.entry_time BETWEEN $1 AND $2
         ORDER BY pr.entry_time DESC
         LIMIT $3 OFFSET $4`,
        [startDate, queryEndDate, limit, offset]
      );
      
      return {
        enteredCars: enteredCars.rows,
        summary: {
          totalRecords: total
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting entered cars report:', error);
      throw error;
    }
  },

  /**
   * Find active parking records for a specific car plate number
   * @param {string} carPlateNumber - Car plate number
   * @returns {Promise<Array>} - Array of active parking records
   */
  findActiveByPlateNumber: async (carPlateNumber) => {
    try {
      const result = await db.query(
        `SELECT pr.*, pl.code as parking_lot_code, pl.name as parking_lot_name
         FROM ParkingRecords pr
         JOIN ParkingLots pl ON pr.parking_lot_id = pl.id
         WHERE pr.car_plate_number = $1 AND pr.exit_time IS NULL`,
        [carPlateNumber]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error finding active parking records by plate number:', error);
      throw error;
    }
  }
};

module.exports = ParkingRecordModel; 