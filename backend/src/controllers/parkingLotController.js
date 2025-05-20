const { validationResult } = require('express-validator');
const db = require('../config/db');

/**
 * @desc    Create a new parking lot
 * @route   POST /api/parking-lots
 * @access  Private/Admin
 */
const createParkingLot = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { code, name, total_spaces, location, fee_per_hour } = req.body;

    // Check if code already exists
    const existingLot = await db.query('SELECT * FROM ParkingLots WHERE code = $1', [code]);
    
    if (existingLot.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parking lot with this code already exists' 
      });
    }

    // Initially set available_spaces equal to total_spaces
    const available_spaces = total_spaces;

    // Create parking lot
    const newParkingLot = await db.query(
      'INSERT INTO ParkingLots (code, name, total_spaces, available_spaces, location, fee_per_hour) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [code, name, total_spaces, available_spaces, location, fee_per_hour]
    );

    res.status(201).json({
      success: true,
      data: newParkingLot.rows[0]
    });
  } catch (error) {
    console.error('Create parking lot error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get all parking lots with pagination
 * @route   GET /api/parking-lots
 * @access  Private
 */
const getParkingLots = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db.query('SELECT COUNT(*) FROM ParkingLots');
    const total = parseInt(countResult.rows[0].count);

    // Get parking lots with pagination
    const parkingLots = await db.query(
      'SELECT * FROM ParkingLots ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    // Log the data for debugging
    console.log('Sending parking lots data:', parkingLots.rows);

    res.json({
      success: true,
      data: parkingLots.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get parking lots error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get a single parking lot by ID
 * @route   GET /api/parking-lots/:id
 * @access  Private
 */
const getParkingLotById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('SELECT * FROM ParkingLots WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Parking lot not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get parking lot error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Update a parking lot
 * @route   PUT /api/parking-lots/:id
 * @access  Private/Admin
 */
const updateParkingLot = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { name, total_spaces, location, fee_per_hour } = req.body;

    // Check if parking lot exists
    const existingLot = await db.query('SELECT * FROM ParkingLots WHERE id = $1', [id]);
    
    if (existingLot.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Parking lot not found' });
    }

    // Calculate new available spaces based on change in total_spaces
    const oldTotalSpaces = existingLot.rows[0].total_spaces;
    const oldAvailableSpaces = existingLot.rows[0].available_spaces;
    
    // If total_spaces is being changed, adjust available_spaces proportionally
    let newAvailableSpaces = oldAvailableSpaces;
    if (total_spaces !== oldTotalSpaces) {
      const occupiedSpaces = oldTotalSpaces - oldAvailableSpaces;
      newAvailableSpaces = Math.max(0, total_spaces - occupiedSpaces);
    }

    // Update parking lot
    const updatedParkingLot = await db.query(
      'UPDATE ParkingLots SET name = $1, total_spaces = $2, available_spaces = $3, location = $4, fee_per_hour = $5 WHERE id = $6 RETURNING *',
      [name, total_spaces, newAvailableSpaces, location, fee_per_hour, id]
    );

    res.json({
      success: true,
      data: updatedParkingLot.rows[0]
    });
  } catch (error) {
    console.error('Update parking lot error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Delete a parking lot
 * @route   DELETE /api/parking-lots/:id
 * @access  Private/Admin
 */
const deleteParkingLot = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if parking lot exists
    const existingLot = await db.query('SELECT * FROM ParkingLots WHERE id = $1', [id]);
    
    if (existingLot.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Parking lot not found' });
    }

    // Check if there are active parking records
    const activeRecords = await db.query(
      'SELECT COUNT(*) FROM ParkingRecords WHERE parking_lot_id = $1 AND exit_time IS NULL',
      [id]
    );

    if (parseInt(activeRecords.rows[0].count) > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete parking lot with active parking records' 
      });
    }

    // Delete parking lot
    await db.query('DELETE FROM ParkingLots WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Parking lot deleted successfully'
    });
  } catch (error) {
    console.error('Delete parking lot error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createParkingLot,
  getParkingLots,
  getParkingLotById,
  updateParkingLot,
  deleteParkingLot
}; 