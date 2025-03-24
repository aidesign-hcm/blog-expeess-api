const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slugify = require("../middleware/slug-format");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("1234567890abcdef", 5);

const postCatSchema = new Schema(
  { 
    name: String,
    featureImg: { type: Object, required: false },
    slug: { type: String, index: true, unique: true },
    index: { type: Number },
    content: { type: String },
    tasks: {type: Array, default: []},
    isFeature: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    parent: { type: Schema.Types.ObjectId, ref: "PostCat", default: null },
    ancestors: [{
      _id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "PostCat"
      },
      name: String,
      slug: String
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("PostCat", postCatSchema);
