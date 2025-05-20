const { body, query, param, validationResult } = require('express-validator');

// Helper function to check validation results
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// User validations
const validateUserRegistration = [
  body('firstName')
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters')
    .trim(),
  body('lastName')
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters')
    .trim(),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please include a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['admin', 'parking_attendant']).withMessage('Role must be either "admin" or "parking_attendant"'),
  validateResults
];

const validateUserLogin = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please include a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validateResults
];

// Parking Lot validations
const validateParkingLotCreation = [
  body('code')
    .notEmpty().withMessage('Code is required')
    .isLength({ min: 2, max: 50 }).withMessage('Code must be between 2 and 50 characters')
    .matches(/^[A-Za-z0-9-_]+$/).withMessage('Code can only contain letters, numbers, hyphens, and underscores')
    .trim(),
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .trim(),
  body('total_spaces')
    .notEmpty().withMessage('Total spaces is required')
    .isInt({ min: 1 }).withMessage('Total spaces must be a positive integer'),
  body('location')
    .optional()
    .isLength({ max: 200 }).withMessage('Location must not exceed 200 characters')
    .trim(),
  body('fee_per_hour')
    .notEmpty().withMessage('Fee per hour is required')
    .isFloat({ min: 0 }).withMessage('Fee per hour must be a positive number'),
  validateResults
];

const validateParkingLotUpdate = [
  param('id')
    .isInt().withMessage('Invalid parking lot ID'),
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .trim(),
  body('total_spaces')
    .notEmpty().withMessage('Total spaces is required')
    .isInt({ min: 1 }).withMessage('Total spaces must be a positive integer'),
  body('location')
    .optional()
    .isLength({ max: 200 }).withMessage('Location must not exceed 200 characters')
    .trim(),
  body('fee_per_hour')
    .notEmpty().withMessage('Fee per hour is required')
    .isFloat({ min: 0 }).withMessage('Fee per hour must be a positive number'),
  validateResults
];

// Parking Record validations
const validateCarEntry = [
  body('car_plate_number')
    .notEmpty().withMessage('Car plate number is required')
    .isLength({ min: 2, max: 20 }).withMessage('Car plate number must be between 2 and 20 characters')
    .matches(/^[A-Za-z0-9-]+$/).withMessage('Car plate number can only contain letters, numbers, and hyphens')
    .trim()
    .toUpperCase(),
  body('parking_lot_id')
    .optional()
    .isInt().withMessage('Parking lot ID must be a valid integer'),
  body('parking_code')
    .optional()
    .isString().withMessage('Parking code must be a string')
    .trim(),
  body()
    .custom((value) => {
      if (!value.parking_lot_id && !value.parking_code) {
        throw new Error('Either parking_lot_id or parking_code is required');
      }
      return true;
    }),
  validateResults
];

const validateRecordExit = [
  param('id')
    .isInt().withMessage('Invalid parking record ID'),
  validateResults
];

// Report validations
const validateDateRange = [
  query('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Start date must be a valid date in format YYYY-MM-DD'),
  query('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('End date must be a valid date in format YYYY-MM-DD')
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.query.startDate)) {
        throw new Error('End date must be greater than or equal to start date');
      }
      return true;
    }),
  validateResults
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateParkingLotCreation,
  validateParkingLotUpdate,
  validateCarEntry,
  validateRecordExit,
  validateDateRange
}; 