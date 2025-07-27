const Stripe = require('stripe');
const User = require('../models/User');
const Plan = require('../models/Plan');
const logger = require('../utils/logger');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Store processed webhook events to prevent duplicates
const processedEvents = new Set();

exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    
    let user = await User.findById(req.user._id);
    
    // Create Stripe customer if doesn't exist
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user._id.toString() },
      });
      user.stripeCustomerId = customer.id;
      await user.save();
      
      logger.logPaymentEvent('customer_created', user._id, {
        stripeCustomerId: customer.id,
        planId
      });
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
      metadata: {
        userId: user._id.toString(),
        planId: planId
      },
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });
    
    logger.logPaymentEvent('checkout_session_created', user._id, {
      sessionId: session.id,
      planId,
      amount: plan.price
    });
    
    res.json({ url: session.url });
  } catch (err) {
    logger.error('Checkout session creation failed', {
      error: err.message,
      userId: req.user._id,
      planId: req.body.planId
    });
    next(err);
  }
};

exports.cancelSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId) {
      return res.status(400).json({ message: 'No Stripe customer found' });
    }
    
    const subscriptions = await stripe.subscriptions.list({ 
      customer: user.stripeCustomerId, 
      status: 'active' 
    });
    
    if (!subscriptions.data.length) {
      return res.status(400).json({ message: 'No active subscription found' });
    }
    
    const subscription = subscriptions.data[0];
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true
    });
    
    // Update user subscription status
    user.subscriptionId = null;
    user.subscriptionStatus = 'cancelled';
    await user.save();
    
    logger.logPaymentEvent('subscription_cancelled', user._id, {
      subscriptionId: subscription.id,
      cancelledAt: new Date()
    });
    
    res.json({ 
      message: 'Subscription will be cancelled at the end of the billing period',
      periodEnd: new Date(subscription.current_period_end * 1000)
    });
  } catch (err) {
    logger.error('Subscription cancellation failed', {
      error: err.message,
      userId: req.user._id
    });
    next(err);
  }
};

exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Prevent duplicate event processing
  if (processedEvents.has(event.id)) {
    logger.info('Duplicate webhook event ignored', { eventId: event.id });
    return res.json({ received: true });
  }
  
  try {
    await handleWebhookEvent(event);
    processedEvents.add(event.id);
    
    // Clean up old event IDs (keep last 1000)
    if (processedEvents.size > 1000) {
      const eventsArray = Array.from(processedEvents);
      processedEvents.clear();
      eventsArray.slice(-500).forEach(id => processedEvents.add(id));
    }
    
    res.json({ received: true });
  } catch (err) {
    logger.error('Webhook event processing failed', {
      error: err.message,
      eventId: event.id,
      eventType: event.type
    });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Handle different webhook events
const handleWebhookEvent = async (event) => {
  logger.info('Processing webhook event', {
    eventId: event.id,
    eventType: event.type
  });
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
      
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
      
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
      
    case 'customer.updated':
      await handleCustomerUpdated(event.data.object);
      break;
      
    default:
      logger.info('Unhandled webhook event type', { eventType: event.type });
  }
};

// Webhook event handlers
const handleCheckoutCompleted = async (session) => {
  const userId = session.metadata?.userId;
  if (!userId) return;
  
  const user = await User.findById(userId);
  if (!user) return;
  
  user.subscriptionId = session.subscription;
  user.subscriptionStatus = 'active';
  user.planId = session.metadata?.planId;
  await user.save();
  
  logger.logPaymentEvent('checkout_completed', userId, {
    sessionId: session.id,
    subscriptionId: session.subscription,
    planId: session.metadata?.planId
  });
};

const handlePaymentSucceeded = async (invoice) => {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const userId = subscription.metadata?.userId;
  
  if (userId) {
    logger.logPaymentEvent('payment_succeeded', userId, {
      invoiceId: invoice.id,
      amount: invoice.amount_paid / 100,
      subscriptionId: invoice.subscription
    });
  }
};

const handlePaymentFailed = async (invoice) => {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const userId = subscription.metadata?.userId;
  
  if (userId) {
    const user = await User.findById(userId);
    if (user) {
      user.subscriptionStatus = 'past_due';
      await user.save();
    }
    
    logger.logPaymentEvent('payment_failed', userId, {
      invoiceId: invoice.id,
      amount: invoice.amount_due / 100,
      subscriptionId: invoice.subscription,
      attemptCount: invoice.attempt_count
    });
  }
};

const handleSubscriptionDeleted = async (subscription) => {
  const userId = subscription.metadata?.userId;
  
  if (userId) {
    const user = await User.findById(userId);
    if (user) {
      user.subscriptionId = null;
      user.subscriptionStatus = 'cancelled';
      user.planId = null;
      await user.save();
    }
    
    logger.logPaymentEvent('subscription_deleted', userId, {
      subscriptionId: subscription.id,
      cancelledAt: new Date(subscription.canceled_at * 1000)
    });
  }
};

const handleSubscriptionUpdated = async (subscription) => {
  const userId = subscription.metadata?.userId;
  
  if (userId) {
    const user = await User.findById(userId);
    if (user) {
      user.subscriptionStatus = subscription.status;
      await user.save();
    }
    
    logger.logPaymentEvent('subscription_updated', userId, {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });
  }
};

const handleCustomerUpdated = async (customer) => {
  const userId = customer.metadata?.userId;
  
  if (userId) {
    logger.logPaymentEvent('customer_updated', userId, {
      customerId: customer.id,
      email: customer.email
    });
  }
};