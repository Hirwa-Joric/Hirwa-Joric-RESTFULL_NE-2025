const { validationResult } = require('express-validator');
const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * @desc    Get dashboard summary (today's check-ins, check-outs, recent activity)
 * @route   GET /api/reports/dashboard-summary
 * @access  Private
 */
const getDashboardSummary = async (req, res) => {
  try {
    logger.info('Fetching dashboard summary');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's check-ins count
    const checkInsResult = await db.query(
      `SELECT COUNT(*) as count
       FROM ParkingRecords
       WHERE entry_time >= $1`,
      [today]
    );
    
    // Get today's check-outs count
    const checkOutsResult = await db.query(
      `SELECT COUNT(*) as count
       FROM ParkingRecords
       WHERE exit_time >= $1 AND exit_time IS NOT NULL`,
      [today]
    );
    
    // Get recent activity (both entries and exits)
    const recentActivityResult = await db.query(
      `SELECT 
         id, 
         car_plate_number, 
         entry_time, 
         exit_time, 
         CASE WHEN exit_time IS NULL THEN 'Entry' ELSE 'Exit' END as activity_type,
         CASE WHEN exit_time IS NULL THEN entry_time ELSE exit_time END as activity_time
       FROM ParkingRecords
       ORDER BY 
         CASE WHEN exit_time IS NULL THEN entry_time ELSE exit_time END DESC
       LIMIT 10`
    );
    
    const recentActivity = recentActivityResult.rows.map(record => ({
      id: record.id,
      plateNumber: record.car_plate_number,
      activity: record.activity_type,
      time: record.activity_time
    }));
    
    const todaySummary = {
      checkIns: parseInt(checkInsResult.rows[0].count),
      checkOuts: parseInt(checkOutsResult.rows[0].count)
    };
    
    logger.debug('Dashboard summary data', { 
      checkIns: todaySummary.checkIns, 
      checkOuts: todaySummary.checkOuts, 
      recentActivityCount: recentActivity.length 
    });
    
    res.json({
      success: true,
      data: {
        todaySummary,
        recentActivity
      }
    });
  } catch (error) {
    logger.error('Get dashboard summary error', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get report of outgoing cars with total amount charged between dates
 * @route   GET /api/reports/outgoing-cars
 * @access  Private/Admin
 */
const getOutgoingCarsReport = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors in outgoing cars report request', { errors: errors.array() });
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    logger.info('Generating outgoing cars report', { startDate, endDate, page, limit });

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

    // Format records to match frontend expectations
    const records = outgoingCars.rows.map(record => {
      const entryTime = new Date(record.entry_time);
      const exitTime = new Date(record.exit_time);
      const durationHours = Math.ceil((exitTime - entryTime) / (1000 * 60 * 60));
      
      return {
        id: record.id.toString(),
        plateNumber: record.car_plate_number,
        parkingLotName: record.parking_lot_name,
        entryTime: record.entry_time.toISOString(),
        exitTime: record.exit_time ? record.exit_time.toISOString() : 'N/A',
        duration: durationHours,
        fee: parseFloat(record.charged_amount)
      };
    });
    
    logger.debug('Outgoing cars report generated', { 
      totalRecords: total,
      totalAmount,
      recordsInPage: records.length,
      page,
      pages: Math.ceil(total / limit)
    });

    res.json({
      success: true,
      records: records,
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
    });
  } catch (error) {
    logger.error('Get outgoing cars report error', { 
      error: error.message, 
      stack: error.stack,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get report of entered cars between dates
 * @route   GET /api/reports/entered-cars
 * @access  Private/Admin
 */
const getEnteredCarsReport = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors in entered cars report request', { errors: errors.array() });
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    logger.info('Generating entered cars report', { startDate, endDate, page, limit });

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

    // Format records to match frontend expectations
    const records = enteredCars.rows.map(record => {
      return {
        id: record.id.toString(),
        plateNumber: record.car_plate_number,
        parkingLotName: record.parking_lot_name,
        entryTime: record.entry_time.toISOString(),
        exitTime: record.exit_time ? record.exit_time.toISOString() : 'N/A',
        duration: 0, // For entered cars without exit, duration is 0
        fee: parseFloat(record.charged_amount) || 0
      };
    });
    
    logger.debug('Entered cars report generated', { 
      totalRecords: total,
      recordsInPage: records.length,
      page,
      pages: Math.ceil(total / limit)
    });

    res.json({
      success: true,
      records: records,
      summary: {
        totalRecords: total
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get entered cars report error', { 
      error: error.message, 
      stack: error.stack,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getDashboardSummary,
  getOutgoingCarsReport,
  getEnteredCarsReport
}; 