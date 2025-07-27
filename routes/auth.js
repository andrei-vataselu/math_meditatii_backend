const express = require('express');
const { body } = require('express-validator');
const authLimiter = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const auth = require('../middlewares/auth');
const authController = require('../controllers/authController');
const { signupValidation, loginValidation } = require('../validators/userValidators');

const router = express.Router();

router.post('/signup', authLimiter, validate(signupValidation), authController.signup);

router.post('/login', authLimiter, validate(loginValidation), authController.login);

router.post('/logout', auth, authController.logout);

router.get('/me', auth, authController.me);

router.post('/refresh', authController.refresh);




module.exports = router; 