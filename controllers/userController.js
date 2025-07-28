const User = require('../models/User');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const updates = (({ firstName, lastName, phoneNumber }) => ({ firstName, lastName, phoneNumber }))(req.body);
    const user = await User.findById(req.user._id);
    let changed = false;
    for (const key of Object.keys(updates)) {
      if (updates[key] !== undefined && updates[key] !== user[key]) {
        changed = true;
        user[key] = updates[key];
      }
    }
    if (!changed) {
      return res.status(400).json({ message: 'No changes detected.' });
    }
    await user.save();
    res.json({ user: await User.findById(req.user._id).select('-password') });
  } catch (err) {
    next(err);
  }
}; 