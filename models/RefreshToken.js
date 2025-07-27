const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  createdByIp: { type: String },
  replacedByToken: { type: String },
  device: { type: String },
}, { timestamps: true });

// Static method to revoke all tokens for a user (for reuse detection)
refreshTokenSchema.statics.revokeAllForUser = async function(userId) {
  await this.updateMany({ user: userId, revoked: false }, { $set: { revoked: true } });
};

// Static method to clean up expired tokens
refreshTokenSchema.statics.removeExpired = async function() {
  await this.deleteMany({ expiresAt: { $lt: new Date() } });
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
module.exports = RefreshToken;
