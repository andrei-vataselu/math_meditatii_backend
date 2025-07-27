const express = require('express');
const auth = require('../middlewares/auth');
const planController = require('../controllers/planController');

const router = express.Router();

router.get('/', planController.getPlans);
router.get('/user', auth, planController.getUserPlan);

module.exports = router; 