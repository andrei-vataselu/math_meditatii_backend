const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number },
  duration: { type: String }, // 'monthly', 'yearly'
  features: [{ type: String }],
}, { timestamps: true });

const Plan = mongoose.model('Plan', planSchema);
module.exports = Plan; 