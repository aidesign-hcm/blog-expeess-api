const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    videoPath: String, // Private path, not exposed to user
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", videoSchema);
