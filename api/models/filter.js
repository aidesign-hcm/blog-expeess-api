const mongoose = require('mongoose');

const { Schema } = mongoose;
const slugify = require('../middleware/slug-format');

const filterSchema = new Schema(
  {
    name: { type: String, unique: true, required: true },
    slug: { type: String, index: true },
    desc: { type: String, default: '' },
    terms: { type: Array },
    select: { type: Array },
  },
  { timestamps: true },
);

filterSchema.pre('save', async function (next) {
  this.slug = slugify(this.name);
  next();
});

module.exports = mongoose.model('Filter', filterSchema);
