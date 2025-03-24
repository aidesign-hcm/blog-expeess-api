const mongoose = require("mongoose");

const { Schema } = mongoose;

const TokenSchema = new Schema(
  {
    sessionToken: { type: String, required: true, unique: true },
    sessionTokenExpiresAt: { type: Date, required: true, index: { expires: 0 } } // TTL index
  },
  { timestamps: true }
);

module.exports = mongoose.model("Token", TokenSchema);
