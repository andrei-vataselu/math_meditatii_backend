const { verifyRefreshToken, extractToken, validateRefreshToken } = require('../utils/token');
const User = require('../models/User');
const logger = require('../utils/logger');

// Middleware for refresh token validation
module.exports = async (req, res, next) => {
  try {
    // Extract refresh token from Authorization header or cookies
    const token = extractToken(req, 'refresh');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No refresh token provided' 
      });
    }

    // Verify the refresh token JWT
    const decoded = verifyRefreshToken(token);
    
    // Validate token exists in database and is not revoked
    const isValid = await validateRefreshToken(token);
    
    if (!isValid) {
      logger.logSecurityEvent('invalid_refresh_token', {
        userId: decoded.userId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Refresh token is invalid or revoked' 
      });
    }
    
    // Find user and attach to request
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      logger.logSecurityEvent('refresh_token_user_not_found', {
        userId: decoded.userId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User not found' 
      });
    }

    // Attach user and token to request
    req.user = user;
    req.userId = user._id.toString();
    req.refreshToken = token;
    
    next();
  } catch (err) {
    // Log refresh token failures for security monitoring
    logger.logSecurityEvent('refresh_token_invalid', {
      error: err.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired refresh token' 
    });
  }
};
