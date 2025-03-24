const mongoose = require('mongoose');

const { Schema } = mongoose;

const PassCode = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

PassCode.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

module.exports = mongoose.model('Passcode', PassCode);
