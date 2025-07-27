const express = require('express');
const auth = require('../middlewares/auth');
const stripeController = require('../controllers/stripeController');

const router = express.Router();

router.post('/create-checkout-session', auth, stripeController.createCheckoutSession);
router.post('/cancel-subscription', auth, stripeController.cancelSubscription);
router.post('/webhook', express.raw({ type: 'application/json' }), stripeController.webhook);

module.exports = router; 