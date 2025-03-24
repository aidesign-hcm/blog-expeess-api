const mongoose = require("mongoose");

const { Schema } = mongoose;
// const mongooseAlgolia = require("mongoose-algolia");
const slugify = require("../middleware/slug-format");

const postSchema = mongoose.Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PostCat",
      },
    ],
    title: { type: String, required: true },
    featureImg: { type: Object, required: true },
    desc: { type: String, required: true },
    slug: { type: String, index: true },
    index: { type: Number },
    isActive: { type: Boolean },
    isFeature: { type: Boolean, default: false },
    short: { type: String, default: "" },
    file: [{ type: Object, required: false }],
    revisions: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" }, // Who updated
        timestamp: { type: Date, default: Date.now }, // When updated
      },
    ],
  },
  { timestamps: true }
);

postSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update && this.options.context && this.options.context.user) {
    update.$push = update.$push || {};
    update.$push.revisions = { user: this.options.context.user, timestamp: new Date() };
  }
  next();
});

// Add a validation rule to limit the number of files
postSchema.path("file").validate(function (files) {
  return files.length <= 100;
}, "You can only upload up to 100 files.");

const Model = mongoose.model("Post", postSchema);


module.exports = Model;
