const User = require('../models/User');
const { signToken, setTokenCookie } = require('../utils/token');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// In-memory store for refresh tokens (replace with DB/Redis for prod)
const refreshTokens = new Set();

const signRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

exports.signup = async (req, res, next) => {
  try {
    if (req.cookies && req.cookies.token) {
      return res.status(400).json({ errors: [{ field: 'global', message: 'Deja ești logat, vezi cookie-uri' }] });
    }
    const { email, password, firstName, lastName, phoneNumber } = req.body;
    if(!phoneNumber)
      return res.json({message:'Trebuie sa iti pui si numarul de telefon'})
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
    const ip = req.headers['x-forwarded-for'] || req.ip;
    const user = await User.create({ email, password, firstName, lastName, phoneNumber, lastSignupIp: ip });
    const token = signToken({ id: user._id });
    const refreshToken = signRefreshToken({ id: user._id });
    refreshTokens.add(refreshToken);
    setTokenCookie(res, token);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
    res.status(201).json({ user: { email: user.email, firstName, lastName, phoneNumber } });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    if (req.cookies && req.cookies.token) {
      return res.status(400).json({ errors: [{ field: 'global', message: 'Deja ești logat, vezi cookie-uri' }] });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const ip = req.headers['x-forwarded-for'] || req.ip;
    user.lastLoginIp = ip;
    await user.save();
    const token = signToken({ id: user._id });
    const refreshToken = signRefreshToken({ id: user._id });
    refreshTokens.add(refreshToken);
    setTokenCookie(res, token);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    res.json({ user: { email: user.email, firstName: user.firstName, lastName: user.lastName, phoneNumber: user.phoneNumber } });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) refreshTokens.delete(refreshToken);
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.refresh = (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken || !refreshTokens.has(refreshToken)) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const token = signToken({ id: decoded.id });
    setTokenCookie(res, token);
    res.json({ message: 'Token refreshed' });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

exports.resetPassword = (req, res) => {
  res.status(501).json({ message: 'Reset password not implemented' });
}; 