const express = require('express');
const { body } = require('express-validator');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const userController = require('../controllers/userController');
const { updateProfileValidation } = require('../validators/userValidators');

const router = express.Router();

router.get('/profile', auth, userController.getProfile);

router.patch('/profile', auth, validate(updateProfileValidation), userController.updateProfile);

module.exports = router; 