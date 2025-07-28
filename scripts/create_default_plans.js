// Script to create default plans in the database
require('dotenv').config();
const mongoose = require('mongoose');
const Plan = require('../models/Plan');

async function createPlans() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const plans = [
    {
      name: 'Free',
      price: 0,
      duration: 'monthly',
      features: ['Basic access', 'Limited resources']
    },
    {
      name: 'Premium',
      price: 180,
      duration: 'monthly',
      features: ['Full access', 'Priority support', 'Advanced resources']
    }
  ];

  let missing = false;
  for (const plan of plans) {
    const exists = await Plan.findOne({ name: plan.name });
    if (!exists) {
      missing = true;
      break;
    }
  }

  if (missing) {
    for (const plan of plans) {
      const exists = await Plan.findOne({ name: plan.name }); 
      if (!exists) {
        await Plan.create(plan);
        console.log(`Created plan: ${plan.name}`);
      } else {
        console.log(`Plan already exists: ${plan.name}`);
      }
    }
  } else {
    console.log('All plans already exist. No changes made.');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

createPlans().catch((err) => {
  console.error('Error creating plans:', err);
  process.exit(1);
});
