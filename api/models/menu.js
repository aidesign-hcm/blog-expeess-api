const mongoose = require("mongoose");

const { Schema } = mongoose;

const menuSchema = new Schema(
  {
    title: { type: String, required: true },
    position: { type: String, enum: ['0', '1', '2', '3', '4', '5', '6', '7', '8'], default: '8' },
    obj: [{
      name: { type: String, required: true },
      text: { type: String, required: true },
      slug: { type: String, required: true },
      parent: { type: Schema.Types.Mixed, default: null }, // Allow any type (string, number, or object)
      id: { type: Number, required: true }, // Corrected Number type
      _id: { type: String, required: true }, // Corrected String type
      droppable: { type: Boolean, default: true }, // Corrected Boolean type
    }],
  },
  { timestamps: true }
);

const Menu = mongoose.model("Menu", menuSchema);

module.exports = Menu;
