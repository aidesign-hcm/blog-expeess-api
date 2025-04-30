const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); 

const verificationCodeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  codeId: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

verificationCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);