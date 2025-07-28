const User = require('../models/User');
const { signToken, setTokenCookie } = require('../utils/token');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const {
  signAccessToken,
  signRefreshToken,
  storeRefreshToken,
  revokeRefreshToken,
  setTokenCookies,
  clearTokenCookies,
  validateRefreshToken,
  verifyRefreshToken
} = require('../utils/token');
const RefreshToken = require('../models/RefreshToken');
const logger = require('../utils/logger');


exports.signup = async (req, res, next) => {
  try {
    // Block signup if already logged in
    const sessionAccessToken = req.cookies.accessToken;
const sessionRefreshToken = req.cookies.refreshToken;
    let alreadyLoggedIn = false;
    if (sessionAccessToken) {
      try {
        require('../utils/token').verifyAccessToken(sessionAccessToken);
        alreadyLoggedIn = true;
      } catch {}
    }
    if (!alreadyLoggedIn && sessionRefreshToken) {
      if (await require('../utils/token').validateRefreshToken(sessionRefreshToken)) alreadyLoggedIn = true;
    }
    if (alreadyLoggedIn) {
      return res.status(400).json({ message: 'Already logged in' });
    }
    const { email, password, firstName, lastName, phoneNumber } = req.body;
    if (!phoneNumber)
      return res.status(400).json({ message: 'Trebuie sa iti pui si numarul de telefon' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
    const ip = req.headers['x-forwarded-for'] || req.ip;
    // Assign Free plan by default
    const Plan = require('../models/Plan');
    const freePlan = await Plan.findOne({ name: 'Free' });
    const user = await User.create({ email, password, firstName, lastName, phoneNumber, lastSignupIp: ip, plan: freePlan ? freePlan._id : null });
    // Revoke all previous refresh tokens for this user (single session policy)
    await RefreshToken.revokeAllForUser(user._id);
    // Issue tokens
    const accessToken = signAccessToken({ userId: user._id });
    const refreshToken = signRefreshToken({ userId: user._id });
    await storeRefreshToken(user._id, refreshToken, { ip });
    setTokenCookies(res, accessToken, refreshToken);
    res.status(201).json({ user: { email: user.email, firstName, lastName, phoneNumber } });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    // Block login if already logged in
    const sessionAccessToken = req.cookies.accessToken;
const sessionRefreshToken = req.cookies.refreshToken;
    let alreadyLoggedIn = false;
    if (sessionAccessToken) {
      try {
        require('../utils/token').verifyAccessToken(sessionAccessToken);
        alreadyLoggedIn = true;
      } catch {}
    }
    if (!alreadyLoggedIn && sessionRefreshToken) {
      if (await require('../utils/token').validateRefreshToken(sessionRefreshToken)) alreadyLoggedIn = true;
    }
    if (alreadyLoggedIn) {
      return res.status(400).json({ message: 'Already logged in' });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const ip = req.headers['x-forwarded-for'] || req.ip;
    user.lastLoginIp = ip;
    await user.save();
    // Revoke all previous refresh tokens for this user (single session policy)
    await RefreshToken.revokeAllForUser(user._id);
    // Issue tokens
    const accessToken = signAccessToken({ userId: user._id });
    const refreshToken = signRefreshToken({ userId: user._id });
    await storeRefreshToken(user._id, refreshToken, { ip });
    setTokenCookies(res, accessToken, refreshToken);
    res.json({ user: { email: user.email, firstName: user.firstName, lastName: user.lastName, phoneNumber: user.phoneNumber } });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken, 'logout');
    }
    clearTokenCookies(res);
    res.json({ message: 'Logged out' });
  } catch (err) {
    logger.error('Logout error', { error: err.message });
    res.status(500).json({ message: 'Logout failed' });
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res) => {
  const logger = require('../utils/logger');
  logger.info('[REFRESH] Incoming cookies:', req.cookies);

  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    logger.warn('[REFRESH] No refreshToken cookie received');
    return res.status(401).json({ message: 'No refresh token cookie' });
  }
  const isValid = await validateRefreshToken(refreshToken);
  logger.info(`[REFRESH] validateRefreshToken result: ${isValid}`);
  if (!isValid) {
    logger.warn('[REFRESH] Refresh token invalid or not found in DB');
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken({ userId: decoded.userId });
    setTokenCookies(res, accessToken, refreshToken);
    res.json({ message: 'Token refreshed' });
  } catch (err) {
    logger.error('[REFRESH] Error verifying refresh token', { error: err.message });
    return res.status(401).json({ message: 'Invalid refresh token', error: err.message });
  }
};