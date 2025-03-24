const mongoose = require("mongoose");

const userLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ip: { type: String, required: true },
    device: { type: String, required: true },
    location: { type: String, default: "Unknown" },
    sessionToken: { type: String, required: true },  // Store session token
    loginTime: { type: Date, required: true },
    logoutTime: { type: Date, default: null },  // Default to null for login time
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserLog", userLogSchema);
