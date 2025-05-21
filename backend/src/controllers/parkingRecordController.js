const { validationResult } = require('express-validator');
const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * @desc    Register car entry
 * @route   POST /api/parking-records/entry
 * @access  Private/ParkingAttendantOrAdmin
 */
const registerCarEntry = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors in car entry request', { errors: errors.array() });
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { car_plate_number, parking_lot_id, parking_code } = req.body;
    
    logger.info('Processing car entry request', { car_plate_number, parking_lot_id, parking_code });
    
    let lotId = parking_lot_id;
    
    // If parking_code is provided instead of id, look up the id
    if (!lotId && parking_code) {
      const parkingLot = await db.query('SELECT id FROM ParkingLots WHERE code = $1', [parking_code]);
      
      if (parkingLot.rows.length === 0) {
        logger.warn('Parking lot not found with the provided code', { parking_code });
        return res.status(404).json({ 
          success: false, 
          message: 'Parking lot not found with the provided code' 
        });
      }
      
      lotId = parkingLot.rows[0].id;
      logger.debug('Resolved parking lot ID from code', { parking_code, lotId });
    }
    
    // Check if parking lot exists
    const parkingLot = await db.query('SELECT * FROM ParkingLots WHERE id = $1', [lotId]);
    
    if (parkingLot.rows.length === 0) {
      logger.warn('Parking lot not found', { lotId });
      return res.status(404).json({ 
        success: false, 
        message: 'Parking lot not found' 
      });
    }
    
    // Check if there are available spaces
    if (parkingLot.rows[0].available_spaces <= 0) {
      logger.warn('No available parking spaces in this lot', { 
        lotId, 
        lotName: parkingLot.rows[0].name,
        availableSpaces: parkingLot.rows[0].available_spaces
      });
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
      logger.warn('Vehicle already has an active parking session', { 
        car_plate_number, 
        existingRecordId: existingRecord.rows[0].id 
      });
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
      // Get fee per hour from parking lot
      const feePerHour = parkingLot.rows[0].fee_per_hour;
      
      // Estimate initial charge for 1 hour (minimum charge)
      const estimatedCharge = feePerHour;
      
      logger.debug('Creating parking record with estimated charge', { 
        car_plate_number, 
        lotId, 
        estimatedCharge 
      });
      
      // Create parking record with estimated charge
      const newRecord = await db.query(
        'INSERT INTO ParkingRecords (car_plate_number, parking_lot_id, entry_time, charged_amount) VALUES ($1, $2, NOW(), $3) RETURNING *',
        [car_plate_number, lotId, estimatedCharge]
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
      
      // Log the successful entry
      logger.logParkingOperation('ENTRY', {
        recordId: newRecord.rows[0].id,
        plateNumber: car_plate_number,
        parkingLotId: lotId,
        parkingLotName: parkingLot.rows[0].name,
        entryTime: newRecord.rows[0].entry_time,
        estimatedCharge: estimatedCharge,
        remainingSpaces: updatedParkingLot.rows[0].available_spaces
      });
      
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
    logger.error('Register car entry error', { error: error.message, stack: error.stack });
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
    
    logger.info('Processing car exit request', { recordId: id });
    
    // Check if parking record exists and hasn't exited yet
    const recordResult = await db.query(
      'SELECT pr.*, pl.fee_per_hour, pl.name as parking_lot_name, pl.id as lot_id FROM ParkingRecords pr JOIN ParkingLots pl ON pr.parking_lot_id = pl.id WHERE pr.id = $1',
      [id]
    );
    
    if (recordResult.rows.length === 0) {
      logger.warn('Parking record not found', { recordId: id });
      return res.status(404).json({ 
        success: false, 
        message: 'Parking record not found' 
      });
    }
    
    const parkingRecord = recordResult.rows[0];
    
    if (parkingRecord.exit_time !== null) {
      logger.warn('Car has already exited', { 
        recordId: id, 
        plateNumber: parkingRecord.car_plate_number,
        exitTime: parkingRecord.exit_time
      });
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
    
    logger.debug('Calculated car exit charges', { 
      recordId: id, 
      plateNumber: parkingRecord.car_plate_number,
      entryTime: parkingRecord.entry_time,
      exitTime: currentTime,
      durationHours,
      feePerHour: parkingRecord.fee_per_hour,
      chargedAmount
    });
    
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
      
      // Log the successful exit
      logger.logParkingOperation('EXIT', {
        recordId: id,
        plateNumber: parkingRecord.car_plate_number,
        parkingLotId: parkingRecord.lot_id,
        parkingLotName: parkingRecord.parking_lot_name,
        entryTime: parkingRecord.entry_time,
        exitTime: updatedRecord.rows[0].exit_time,
        durationHours,
        chargedAmount,
        availableSpaces: updatedParkingLot.rows[0].available_spaces
      });
      
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
    logger.error('Record car exit error', { error: error.message, stack: error.stack });
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
    
    logger.debug('Fetching all parking records', { page, limit, offset });
    
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
    
    logger.debug('Retrieved parking records', { 
      count: parkingRecords.rows.length, 
      total,
      page,
      limit
    });
    
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
    logger.error('Get parking records error', { error: error.message, stack: error.stack });
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
    
    logger.debug('Fetching parking record by ID', { recordId: id });
    
    const result = await db.query(
      `SELECT pr.*, pl.code as parking_lot_code, pl.name as parking_lot_name, pl.fee_per_hour
       FROM ParkingRecords pr 
       JOIN ParkingLots pl ON pr.parking_lot_id = pl.id 
       WHERE pr.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      logger.warn('Parking record not found by ID', { recordId: id });
      return res.status(404).json({ success: false, message: 'Parking record not found' });
    }
    
    const record = result.rows[0];
    let durationHours = null;
    
    if (record.entry_time && record.exit_time) {
      const entryTime = new Date(record.entry_time);
      const exitTime = new Date(record.exit_time);
      durationHours = Math.ceil((exitTime - entryTime) / (1000 * 60 * 60));
    }
    
    logger.debug('Retrieved parking record by ID', { 
      recordId: id, 
      plateNumber: record.car_plate_number,
      durationHours
    });
    
    res.json({
      success: true,
      data: {
        ...record,
        durationHours
      }
    });
  } catch (error) {
    logger.error('Get parking record error', { error: error.message, stack: error.stack });
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
    
    logger.debug('Finding active parking record by plate number', { plateNumber });
    
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
      logger.warn('No active parking record found for vehicle', { plateNumber });
      return res.status(404).json({ 
        success: false, 
        message: 'No active parking record found for this vehicle' 
      });
    }
    
    // Include additional information in the response
    const record = result.rows[0];
    
    logger.debug('Found active parking record', { 
      recordId: record.id, 
      plateNumber,
      parkingLotName: record.parking_lot_name,
      entryTime: record.entry_time
    });
    
    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    logger.error('Find active record by plate error', { error: error.message, plateNumber: req.params.plateNumber, stack: error.stack });
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