const express = require('express');
const { query } = require('express-validator');
const { 
  getOutgoingCarsReport, 
  getEnteredCarsReport,
  getDashboardSummary
} = require('../controllers/reportController');
const { authenticate, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/reports/dashboard-summary:
 *   get:
 *     summary: Get dashboard summary data including today's check-ins/check-outs and recent activity
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     todaySummary:
 *                       type: object
 *                       properties:
 *                         checkIns:
 *                           type: integer
 *                           example: 24
 *                         checkOuts:
 *                           type: integer
 *                           example: 18
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           plateNumber:
 *                             type: string
 *                             example: ABC123
 *                           activity:
 *                             type: string
 *                             example: Entry
 *                           time:
 *                             type: string
 *                             format: date-time
 *                             example: 2023-05-19 09:23:15
 *       401:
 *         description: Not authorized
 */
router.get(
  '/dashboard-summary',
  authenticate,
  getDashboardSummary
);

/**
 * @swagger
 * /api/reports/outgoing-cars:
 *   get:
 *     summary: Get report of outgoing cars with total amount charged between dates
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
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
 *         description: Report of outgoing cars
 *       400:
 *         description: Invalid date format
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied
 */
router.get(
  '/outgoing-cars',
  authenticate,
  isAdmin,
  [
    query('startDate')
      .isISO8601()
      .withMessage('Start date must be a valid date in format YYYY-MM-DD'),
    query('endDate')
      .isISO8601()
      .withMessage('End date must be a valid date in format YYYY-MM-DD')
      .custom((value, { req }) => {
        if (new Date(value) < new Date(req.query.startDate)) {
          throw new Error('End date must be greater than or equal to start date');
        }
        return true;
      })
  ],
  getOutgoingCarsReport
);

/**
 * @swagger
 * /api/reports/entered-cars:
 *   get:
 *     summary: Get report of entered cars between dates
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
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
 *         description: Report of entered cars
 *       400:
 *         description: Invalid date format
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Access denied
 */
router.get(
  '/entered-cars',
  authenticate,
  isAdmin,
  [
    query('startDate')
      .isISO8601()
      .withMessage('Start date must be a valid date in format YYYY-MM-DD'),
    query('endDate')
      .isISO8601()
      .withMessage('End date must be a valid date in format YYYY-MM-DD')
      .custom((value, { req }) => {
        if (new Date(value) < new Date(req.query.startDate)) {
          throw new Error('End date must be greater than or equal to start date');
        }
        return true;
      })
  ],
  getEnteredCarsReport
);

module.exports = router; 