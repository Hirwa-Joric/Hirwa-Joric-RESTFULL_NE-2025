const express = require('express');
const { body } = require('express-validator');
const { 
  registerCarEntry, 
  recordCarExit, 
  getParkingRecords, 
  getParkingRecordById,
  findActiveByPlate
} = require('../controllers/parkingRecordController');
const { 
  authenticate, 
  isAdmin, 
  isParkingAttendantOrAdmin 
} = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/parking-records/entry:
 *   post:
 *     summary: Register car entry
 *     tags: [Parking Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - car_plate_number
 *             properties:
 *               car_plate_number:
 *                 type: string
 *               parking_lot_id:
 *                 type: integer
 *                 description: ID of the parking lot
 *               parking_code:
 *                 type: string
 *                 description: Code of the parking lot (alternative to parking_lot_id)
 *     responses:
 *       201:
 *         description: Car entry registered successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Parking lot not found
 */
router.post(
  '/entry',
  authenticate,
  isParkingAttendantOrAdmin,
  [
    body('car_plate_number').notEmpty().withMessage('Car plate number is required'),
    body('parking_lot_id')
      .optional()
      .isInt()
      .withMessage('Parking lot ID must be a valid integer'),
    body('parking_code')
      .optional()
      .isString()
      .withMessage('Parking code must be a string'),
    body()
      .custom((value) => {
        if (!value.parking_lot_id && !value.parking_code) {
          throw new Error('Either parking_lot_id or parking_code is required');
        }
        return true;
      })
  ],
  registerCarEntry
);

/**
 * @swagger
 * /api/parking-records/exit/{id}:
 *   put:
 *     summary: Record car exit and generate bill
 *     tags: [Parking Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parking record ID
 *     responses:
 *       200:
 *         description: Car exit recorded and bill generated successfully
 *       400:
 *         description: Car has already exited
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Parking record not found
 */
router.put('/exit/:id', authenticate, isParkingAttendantOrAdmin, recordCarExit);

/**
 * @swagger
 * /api/parking-records:
 *   get:
 *     summary: Get all parking records
 *     tags: [Parking Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of parking records
 *       401:
 *         description: Not authorized
 */
router.get('/', authenticate, isAdmin, getParkingRecords);

/**
 * @swagger
 * /api/parking-records/plate/{plateNumber}:
 *   get:
 *     summary: Find active parking record by car plate number
 *     tags: [Parking Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: plateNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Car plate number
 *     responses:
 *       200:
 *         description: Active parking record found
 *       401:
 *         description: Not authorized
 *       404:
 *         description: No active parking record found
 */
router.get('/plate/:plateNumber', authenticate, isParkingAttendantOrAdmin, findActiveByPlate);

/**
 * @swagger
 * /api/parking-records/{id}:
 *   get:
 *     summary: Get a parking record by ID
 *     tags: [Parking Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parking record ID
 *     responses:
 *       200:
 *         description: Parking record details
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Parking record not found
 */
router.get('/:id', authenticate, isParkingAttendantOrAdmin, getParkingRecordById);

module.exports = router; 