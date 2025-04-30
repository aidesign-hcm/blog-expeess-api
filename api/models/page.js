const mongoose = require("mongoose");

const { Schema } = mongoose;
// const mongooseAlgolia = require("mongoose-algolia");
const slugify = require("../middleware/slug-format");

const pageSchema = mongoose.Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    desc: { type: String, required: true },
    slug: { type: String, index: true },
    index: { type: Number },
    isActive: { type: Boolean },
    short: { type: String, default: "" },
    revisions: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" }, // Who updated
        timestamp: { type: Date, default: Date.now }, // When updated
        changes: { type: Object, default: {} }, // Track changes
      },
    ],
  },
  { timestamps: true }
);

pageSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update && this.options.context && this.options.context.user) {
    update.$push = update.$push || {};
    update.$push.revisions = {
      user: this.options.context.user,
      timestamp: new Date(),
    };
  }
  next();
});

const Model = mongoose.model("Page", pageSchema);

module.exports = Model;
