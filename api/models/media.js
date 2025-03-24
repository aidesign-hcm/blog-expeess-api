const mongoose = require('mongoose');

const { Schema } = mongoose;

const mediaSchema = new Schema(
  {
    path: { type: String },
    folder: { type: String }
  },
  { timestamps: true },
);

module.exports = mongoose.model('Media', mediaSchema);
