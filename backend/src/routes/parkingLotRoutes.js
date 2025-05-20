const express = require('express');
const { body } = require('express-validator');
const { 
  createParkingLot, 
  getParkingLots, 
  getParkingLotById, 
  updateParkingLot, 
  deleteParkingLot 
} = require('../controllers/parkingLotController');
const { authenticate, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/parking-lots:
 *   post:
 *     summary: Create a new parking lot
 *     tags: [Parking Lots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - total_spaces
 *               - fee_per_hour
 *             properties:
 *               code:
 *                 type: string
 *                 description: Unique code for the parking lot
 *               name:
 *                 type: string
 *               total_spaces:
 *                 type: integer
 *                 minimum: 1
 *               location:
 *                 type: string
 *               fee_per_hour:
 *                 type: number
 *                 format: float
 *     responses:
 *       201:
 *         description: Parking lot created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  [
    body('code').notEmpty().withMessage('Code is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('total_spaces')
      .isInt({ min: 1 })
      .withMessage('Total spaces must be a positive integer'),
    body('fee_per_hour')
      .isFloat({ min: 0 })
      .withMessage('Fee per hour must be a positive number')
  ],
  createParkingLot
);

/**
 * @swagger
 * /api/parking-lots:
 *   get:
 *     summary: Get all parking lots
 *     tags: [Parking Lots]
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
 *         description: List of parking lots
 *       401:
 *         description: Not authorized
 */
router.get('/', authenticate, getParkingLots);

/**
 * @swagger
 * /api/parking-lots/{id}:
 *   get:
 *     summary: Get a parking lot by ID
 *     tags: [Parking Lots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parking lot ID
 *     responses:
 *       200:
 *         description: Parking lot details
 *       404:
 *         description: Parking lot not found
 *       401:
 *         description: Not authorized
 */
router.get('/:id', authenticate, getParkingLotById);

/**
 * @swagger
 * /api/parking-lots/{id}:
 *   put:
 *     summary: Update a parking lot
 *     tags: [Parking Lots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parking lot ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - total_spaces
 *               - fee_per_hour
 *             properties:
 *               name:
 *                 type: string
 *               total_spaces:
 *                 type: integer
 *                 minimum: 1
 *               location:
 *                 type: string
 *               fee_per_hour:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Parking lot updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Parking lot not found
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('total_spaces')
      .isInt({ min: 1 })
      .withMessage('Total spaces must be a positive integer'),
    body('fee_per_hour')
      .isFloat({ min: 0 })
      .withMessage('Fee per hour must be a positive number')
  ],
  updateParkingLot
);

/**
 * @swagger
 * /api/parking-lots/{id}:
 *   delete:
 *     summary: Delete a parking lot
 *     tags: [Parking Lots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parking lot ID
 *     responses:
 *       200:
 *         description: Parking lot deleted successfully
 *       400:
 *         description: Cannot delete parking lot with active records
 *       404:
 *         description: Parking lot not found
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied
 */
router.delete('/:id', authenticate, isAdmin, deleteParkingLot);

module.exports = router; 