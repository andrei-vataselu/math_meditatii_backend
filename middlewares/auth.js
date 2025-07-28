const {
  verifyAccessToken,
  extractToken,
  verifyRefreshToken,
  validateRefreshToken,
  signAccessToken,
  setTokenCookies
} = require('../utils/token');
const User = require('../models/User');
const logger = require('../utils/logger');

module.exports = async (req, res, next) => {
  try {
    // Extract access token
    let token = extractToken(req, 'access');
    let decoded;
    let user;
    let accessTokenValid = true;
    try {
      decoded = verifyAccessToken(token);
      user = await User.findById(decoded.userId).select('-password');
      if (!user) throw new Error('User not found');
    } catch (err) {
      accessTokenValid = false;
    }

    // If access token is invalid/expired, try to refresh
    if (!accessTokenValid) {
      const refreshToken = extractToken(req, 'refresh');
      if (!refreshToken) {
        logger.logSecurityEvent('auth_token_invalid', {
          error: 'No refresh token',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path
        });
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token, and no refresh token provided'
        });
      }
      try {
        const refreshDecoded = verifyRefreshToken(refreshToken);
        const validRefresh = await validateRefreshToken(refreshToken);
        if (!validRefresh) throw new Error('Refresh token invalid or revoked');
        user = await User.findById(refreshDecoded.userId).select('-password');
        if (!user) throw new Error('User not found');
        // Issue new access token
        const newAccessToken = signAccessToken({ userId: user._id });
        setTokenCookies(res, newAccessToken, refreshToken);
        token = newAccessToken;
        decoded = verifyAccessToken(token);
        logger.logSecurityEvent('access_token_refreshed', {
          userId: user._id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path
        });
      } catch (refreshErr) {
        logger.logSecurityEvent('auth_token_invalid', {
          error: refreshErr.message,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path
        });
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token, and refresh failed'
        });
      }
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (err) {
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