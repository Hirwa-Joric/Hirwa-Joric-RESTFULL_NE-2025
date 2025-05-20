const { validationResult } = require('express-validator');
const db = require('../config/db');

/**
 * @desc    Register car entry
 * @route   POST /api/parking-records/entry
 * @access  Private/ParkingAttendantOrAdmin
 */
const registerCarEntry = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { car_plate_number, parking_lot_id, parking_code } = req.body;
    
    let lotId = parking_lot_id;
    
    // If parking_code is provided instead of id, look up the id
    if (!lotId && parking_code) {
      const parkingLot = await db.query('SELECT id FROM ParkingLots WHERE code = $1', [parking_code]);
      
      if (parkingLot.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Parking lot not found with the provided code' 
        });
      }
      
      lotId = parkingLot.rows[0].id;
    }
    
    // Check if parking lot exists
    const parkingLot = await db.query('SELECT * FROM ParkingLots WHERE id = $1', [lotId]);
    
    if (parkingLot.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parking lot not found' 
      });
    }
    
    // Check if there are available spaces
    if (parkingLot.rows[0].available_spaces <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No available parking spaces in this lot' 
      });
    }
    
    // NEW CODE: Check if the car already has an active parking record
    const existingRecord = await db.query(
      'SELECT * FROM ParkingRecords WHERE car_plate_number = $1 AND exit_time IS NULL',
      [car_plate_number]
    );
    
    if (existingRecord.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This vehicle already has an active parking session',
        data: {
          record: existingRecord.rows[0]
        }
      });
    }
    
    // Start a transaction
    const client = await db.query('BEGIN');
    
    try {
      // Create parking record
      const newRecord = await db.query(
        'INSERT INTO ParkingRecords (car_plate_number, parking_lot_id, entry_time) VALUES ($1, $2, NOW()) RETURNING *',
        [car_plate_number, lotId]
      );
      
      // Decrement available spaces
      await db.query(
        'UPDATE ParkingLots SET available_spaces = available_spaces - 1 WHERE id = $1',
        [lotId]
      );
      
      // Commit the transaction
      await db.query('COMMIT');
      
      // Get updated parking lot info
      const updatedParkingLot = await db.query('SELECT * FROM ParkingLots WHERE id = $1', [lotId]);
      
      res.status(201).json({
        success: true,
        data: {
          ticket: newRecord.rows[0],
          parkingLot: updatedParkingLot.rows[0]
        }
      });
    } catch (error) {
      // Rollback in case of error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Register car entry error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Record car exit and generate bill
 * @route   PUT /api/parking-records/exit/:id
 * @access  Private/ParkingAttendantOrAdmin
 */
const recordCarExit = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if parking record exists and hasn't exited yet
    const recordResult = await db.query(
      'SELECT pr.*, pl.fee_per_hour, pl.name as parking_lot_name, pl.id as lot_id FROM ParkingRecords pr JOIN ParkingLots pl ON pr.parking_lot_id = pl.id WHERE pr.id = $1',
      [id]
    );
    
    if (recordResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parking record not found' 
      });
    }
    
    const parkingRecord = recordResult.rows[0];
    
    if (parkingRecord.exit_time !== null) {
      return res.status(400).json({ 
        success: false, 
        message: 'This car has already exited' 
      });
    }
    
    // Calculate duration and amount
    const currentTime = new Date();
    const entryTime = new Date(parkingRecord.entry_time);
    
    // Calculate duration in hours (rounded up - e.g., 1h 15m = 2h)
    const durationHours = Math.ceil((currentTime - entryTime) / (1000 * 60 * 60));
    
    // Calculate charged amount
    const chargedAmount = durationHours * parkingRecord.fee_per_hour;
    
    // Start a transaction
    const client = await db.query('BEGIN');
    
    try {
      // Update parking record
      const updatedRecord = await db.query(
        'UPDATE ParkingRecords SET exit_time = NOW(), charged_amount = $1 WHERE id = $2 RETURNING *',
        [chargedAmount, id]
      );
      
      // Increment available spaces
      await db.query(
        'UPDATE ParkingLots SET available_spaces = available_spaces + 1 WHERE id = $1',
        [parkingRecord.lot_id]
      );
      
      // Commit the transaction
      await db.query('COMMIT');
      
      // Get updated parking lot info
      const updatedParkingLot = await db.query('SELECT * FROM ParkingLots WHERE id = $1', [parkingRecord.lot_id]);
      
      // Construct the bill with the necessary fields for the frontend
      const bill = {
        ...updatedRecord.rows[0],
        durationHours,
        fee_per_hour: parkingRecord.fee_per_hour,
        parking_lot_name: parkingRecord.parking_lot_name  // Include the parking lot name
      };
      
      res.json({
        success: true,
        data: {
          bill,
          parkingLot: updatedParkingLot.rows[0]
        }
      });
    } catch (error) {
      // Rollback in case of error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Record car exit error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get all parking records with pagination
 * @route   GET /api/parking-records
 * @access  Private/Admin
 */
const getParkingRecords = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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
    
    res.json({
      success: true,
      data: parkingRecords.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get parking records error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get a single parking record by ID
 * @route   GET /api/parking-records/:id
 * @access  Private
 */
const getParkingRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT pr.*, pl.code as parking_lot_code, pl.name as parking_lot_name, pl.fee_per_hour
       FROM ParkingRecords pr 
       JOIN ParkingLots pl ON pr.parking_lot_id = pl.id 
       WHERE pr.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Parking record not found' });
    }
    
    const record = result.rows[0];
    let durationHours = null;
    
    if (record.entry_time && record.exit_time) {
      const entryTime = new Date(record.entry_time);
      const exitTime = new Date(record.exit_time);
      durationHours = Math.ceil((exitTime - entryTime) / (1000 * 60 * 60));
    }
    
    res.json({
      success: true,
      data: {
        ...record,
        durationHours
      }
    });
  } catch (error) {
    console.error('Get parking record error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Find active parking record by car plate number
 * @route   GET /api/parking-records/plate/:plateNumber
 * @access  Private/ParkingAttendantOrAdmin
 */
const findActiveByPlate = async (req, res) => {
  try {
    const { plateNumber } = req.params;
    
    // Find active parking record with the given plate number (no exit time)
    const result = await db.query(
      `SELECT pr.*, pl.code as parking_lot_code, pl.name as parking_lot_name, pl.fee_per_hour
       FROM ParkingRecords pr 
       JOIN ParkingLots pl ON pr.parking_lot_id = pl.id 
       WHERE pr.car_plate_number = $1 AND pr.exit_time IS NULL
       ORDER BY pr.entry_time DESC
       LIMIT 1`,
      [plateNumber]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active parking record found for this vehicle' 
      });
    }
    
    // Include additional information in the response
    const record = result.rows[0];
    
    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Find active record by plate error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  registerCarEntry,
  recordCarExit,
  getParkingRecords,
  getParkingRecordById,
  findActiveByPlate
}; 