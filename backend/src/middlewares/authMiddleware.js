const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to check if user is authenticated
const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided or invalid format' 
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload to request object
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin role required' 
    });
  }
};

// Middleware to check if user is parking attendant or admin
const isParkingAttendantOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'parking_attendant' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Parking attendant or admin role required' 
    });
  }
};

module.exports = {
  authenticate,
  isAdmin,
  isParkingAttendantOrAdmin
}; 