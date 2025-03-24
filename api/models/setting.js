const mongoose = require("mongoose");

const { Schema } = mongoose;

const settingSchema = new Schema(
  {
    title: { type: String, required: true },
    desc: { type: String , default: ''},
    address: { type: String, default: "" },
    email: { type: String, default: "" },
    hotline: { type: String, default: "" },
    contact: { type: String, default: "" },
    copyright: { type: String, default: '' },
    footerBLock1: { type: String, default: '' },
    footerBLock2: { type: String, default: '' },
    openReg: {type: Object, default: true },
    logo: { type: Object, required: true },
    ads1: { type: String, default: '' },
  },
  { capped: { max: 1 } }
);
module.exports = mongoose.model("Setting", settingSchema);
