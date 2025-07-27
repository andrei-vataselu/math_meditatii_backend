const Plan = require('../models/Plan');
const User = require('../models/User');

exports.getPlans = async (req, res, next) => {
  try {
    const plans = await Plan.find();
    res.json({ plans });
  } catch (err) {
    next(err);
  }
};

exports.getUserPlan = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('plan');
    res.json({ plan: user.plan });
  } catch (err) {
    next(err);
  }
}; 