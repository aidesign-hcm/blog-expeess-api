const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema(
  {
    isActive: { type: Boolean, default: false },
    content: { type: String },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    reply: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Comment",
        },
      },
    ],
    level: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
