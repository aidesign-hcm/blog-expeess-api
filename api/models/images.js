const mongoose = require('mongoose');

const { Schema } = mongoose;

const imagesSchema = new Schema(
  {
    imgs: { type: Array, required: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Images', imagesSchema);
