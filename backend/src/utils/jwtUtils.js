const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Generate JWT token for user
 * @param {Object} user - User object containing id, email, and role
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '3h'
    }
  );
};

module.exports = {
  generateToken
}; 