const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const logger = require('./logger');

// Generate access token (short-lived)
const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

// Generate refresh token (long-lived)
const signRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

// Verify access token
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
};

// Generate secure token ID
const generateTokenId = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Store refresh token in database
const storeRefreshToken = async (userId, token, deviceInfo = {}) => {
  const tokenId = generateTokenId();
  const decoded = verifyRefreshToken(token);
  
  const refreshToken = new RefreshToken({
    tokenId,
    user: userId,
    token,
    expiresAt: new Date(decoded.exp * 1000),
    deviceInfo
  });
  
  await refreshToken.save();
  return tokenId;
};

// Rotate refresh token (invalidate old, create new)
const rotateRefreshToken = async (oldToken, userId, deviceInfo = {}) => {
  try {
    // Verify the old token
    const decoded = verifyRefreshToken(oldToken);
    
    // Find and revoke the old token
    const oldRefreshToken = await RefreshToken.findOne({ 
      token: oldToken, 
      userId,
      isRevoked: false 
    });
    
    if (!oldRefreshToken) {
      throw new Error('Refresh token not found or already revoked');
    }
    
    // Check for reuse detection
    if (oldRefreshToken.isRevoked) {
      logger.warn('Refresh token reuse detected', { userId, tokenId: oldRefreshToken.tokenId });
      // Revoke all tokens for this user as security measure
      await RefreshToken.revokeAllForUser(userId, 'reuse_detected');
      throw new Error('Token reuse detected - all sessions invalidated');
    }
    
    // Revoke the old token
    oldRefreshToken.isRevoked = true;
    oldRefreshToken.revokedAt = new Date();
    oldRefreshToken.revokedReason = 'rotation';
    await oldRefreshToken.save();
    
    // Generate new tokens
    const newAccessToken = signAccessToken({ userId });
    const newRefreshToken = signRefreshToken({ userId });
    
    // Store new refresh token
    const tokenId = await storeRefreshToken(userId, newRefreshToken, deviceInfo);
    
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenId
    };
    
  } catch (error) {
    logger.error('Token rotation failed', { error: error.message, userId });
    throw error;
  }
};

// Revoke refresh token
const revokeRefreshToken = async (token, reason = 'logout') => {
  try {
    const refreshToken = await RefreshToken.findOne({ token, isRevoked: false });
    if (refreshToken) {
      refreshToken.isRevoked = true;
      refreshToken.revokedAt = new Date();
      refreshToken.revokedReason = reason;
      await refreshToken.save();
    }
  } catch (error) {
    logger.error('Token revocation failed', { error: error.message });
    throw error;
  }
};

// Set secure cookies for tokens
const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Access token cookie (short-lived)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  
  // Refresh token cookie (long-lived)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Clear token cookies
const clearTokenCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

// Extract token from Authorization header or cookies
const extractToken = (req, tokenType = 'access') => {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Fallback to cookies
  const cookieName = tokenType === 'access' ? 'accessToken' : 'refreshToken';
  return req.cookies[cookieName];
};

// Validate refresh token exists in database
const validateRefreshToken = async (token) => {
  const refreshToken = await RefreshToken.findOne({ 
    token, 
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });
  
  return refreshToken !== null;
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenId,
  storeRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  setTokenCookies,
  clearTokenCookies,
  extractToken,
  validateRefreshToken,
  // Legacy support
  signToken: signAccessToken,
  verifyToken: verifyAccessToken,
  setTokenCookie: (res, token) => setTokenCookies(res, token, null)
};