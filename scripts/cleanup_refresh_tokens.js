// Script to delete revoked or expired refresh tokens from the DB
require('dotenv').config();
const mongoose = require('mongoose');
const RefreshToken = require('../models/RefreshToken');

async function cleanupTokens() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const now = new Date();
  const result = await RefreshToken.deleteMany({
    $or: [
      { isRevoked: true },
      { expiresAt: { $lt: now } }
    ]
  });
  console.log(`Deleted ${result.deletedCount} revoked or expired refresh tokens.`);
  await mongoose.disconnect();
}

cleanupTokens().catch((err) => {
  console.error('Error cleaning up tokens:', err);
  process.exit(1);
});
