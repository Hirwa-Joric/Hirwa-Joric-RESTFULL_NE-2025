const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const logger = require('./utils/logger');

// Initialize express app
const app = express();

// Configure request logging with morgan and our custom logger
app.use(morgan('combined', { stream: logger.stream }));

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'], // Add all common dev ports
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'XWZ Car Parking Management API',
      version: '1.0.0',
      description: 'API documentation for XWZ Car Parking Management System',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Import routes
const userRoutes = require('./routes/userRoutes');
const parkingLotRoutes = require('./routes/parkingLotRoutes');
const parkingRecordRoutes = require('./routes/parkingRecordRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/parking-lots', parkingLotRoutes);
app.use('/api/parking-records', parkingRecordRoutes);
app.use('/api/reports', reportRoutes);

// Home route
app.get('/', (req, res) => {
  logger.info('Home route accessed');
  res.json({ message: 'Welcome to XWZ Car Parking Management API' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Global error handler caught an error', { 
    error: err.message, 
    stack: err.stack,
    method: req.method,
    url: req.originalUrl
  });
  
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server started and running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  logger.info('Received shutdown signal, closing server gracefully');
  server.close(() => {
    logger.info('Server closed successfully');
    process.exit(0);
  });
  
  // Force close if not closed within 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
} 

