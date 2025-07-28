const app = require('./app');
const connectDB = require('./config/db');
// dstart the server after connecting 
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await ensurePlans();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to connect to DB', err);
  process.exit(1); 
});
const Plan = require('./models/Plan');

async function ensurePlans() {
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

  for (const plan of plans) {
    const existing = await Plan.findOne({ name: plan.name });
    if (!existing) {
      await Plan.create(plan);
      console.log(`Created plan: ${plan.name}`);
    } else {
      // Update if any field is different
      let needsUpdate = false;
      for (const key of Object.keys(plan)) {
        if (JSON.stringify(existing[key]) !== JSON.stringify(plan[key])) {
          needsUpdate = true;
          existing[key] = plan[key];
        }
      }
      if (needsUpdate) {
        await existing.save();
        console.log(`Updated plan: ${plan.name}`);
      } else {
        console.log(`Plan up-to-date: ${plan.name}`);
      }
    }
  }
}

async function getCurrentPlan(name = 'Premium') {
  // Returns the most current plan by name (default: Premium)
  return await Plan.findOne({ name }).sort({ updatedAt: -1 });
}

module.exports = { getCurrentPlan };