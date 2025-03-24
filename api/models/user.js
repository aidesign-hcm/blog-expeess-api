const mongoose = require("mongoose");

const { Schema } = mongoose;
const bcrypt = require("bcryptjs");
const { accessibleRecordsPlugin } = require("@casl/mongoose");

const userSchema = new Schema(
  {
    username: { type: String, required: false },
    phonenumber: { type: String, unique: true, sparse: true, required: false  },
    email: {
      type: String,
      required: true,
      unique: true,
      match:
        // eslint-disable-next-line no-useless-escape
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    },
    password: {
      type: String,
      required: true,
    },
    resetlink: {
      type: String,
      default: "",
    },
    private: {
      type: Boolean,
      default: false,
    },
    rule: { type: String, enum: ["admin", "manager", "editor", "user"], default: "user" },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PostCat",
      },
    ],
    point: { type: Number, default: 0 },
    code: { type: String, index: true, unique: true },
    Passcode: { type: Schema.Types.ObjectId, ref: "Passcode" },
    avatar: { type: String },
    address: { type: Schema.Types.ObjectId, ref: "Address" },
    rank: { type: String, enum: ["1", "2", "3", "4", "5"], default: "1" },
    bio: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Not"], default: "Not" },
  },
  { timestamps: true }
);

userSchema.plugin(accessibleRecordsPlugin);

userSchema.methods.comparePassword = function (password) {
  const user = this;
  return bcrypt.compareSync(password, user.password);
};

userSchema.index({ phonenumber: 1 }, { unique: true, partialFilterExpression: { phonenumber: { $exists: true } } });

module.exports = mongoose.model("User", userSchema);
