const Stripe = require('stripe');
const User = require('../models/User');
const Plan = require('../models/Plan');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    let user = await User.findById(req.user._id);
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user._id.toString() },
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: user.stripeCustomerId,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: plan.name },
          unit_amount: plan.price * 100,
          recurring: { interval: plan.duration },
        },
        quantity: 1,
      }],
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });
    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
};

exports.cancelSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId) return res.status(400).json({ message: 'No Stripe customer' });
    const subscriptions = await stripe.subscriptions.list({ customer: user.stripeCustomerId, status: 'active' });
    if (!subscriptions.data.length) return res.status(400).json({ message: 'No active subscription' });
    await stripe.subscriptions.del(subscriptions.data[0].id);
    res.json({ message: 'Subscription cancelled' });
  } catch (err) {
    next(err);
  }
};

exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  // TODO: handle events (subscription updates, etc.)
  res.json({ received: true });
}; 