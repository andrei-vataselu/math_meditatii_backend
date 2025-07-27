const { verifyAccessToken, extractToken } = require('../utils/token');
const User = require('../models/User');
const logger = require('../utils/logger');

module.exports = async (req, res, next) => {
  try {
    // Extract token from Authorization header or cookies
    const token = extractToken(req, 'access');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No access token provided' 
      });
    }

    // Verify the access token
    const decoded = verifyAccessToken(token);
    
    // Find user and attach to request
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      logger.logSecurityEvent('invalid_user_token', {
        userId: decoded.userId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User not found' 
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id.toString();
    
    next();
  } catch (err) {
    // Log authentication failures for security monitoring
    logger.logSecurityEvent('auth_token_invalid', {
      error: err.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired token' 
    });
  }
};