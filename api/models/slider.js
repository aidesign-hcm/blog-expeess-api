const mongoose = require("mongoose");

const { Schema } = mongoose;

const SliderSchema = new Schema(
  {
    title: { type: String, required: true },
    images: [
      {
        path: String,
      },
    ],
    position: {
      type: String,
      enum: ["none", "home", "product", "blog", "mobile"],
      default: "none",
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Slider", SliderSchema);
