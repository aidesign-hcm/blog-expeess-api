/* eslint-disable no-underscore-dangle */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { customAlphabet } = require("nanoid");
const { ForbiddenError } = require("@casl/ability");
const axios = require("axios");
const User = require("../models/user");
const Token = require("../models/token");
const Passcode = require("../models/Passcode.js");
const {
  genToken,
  adminGenToken,
  changeToken,
} = require("../middleware/gen-token");
const defineAbilityFor = require("../permissions/abilities");
const mailer = require("../middleware/mailer");
const sharp = require("sharp");
const {
  PassChanged,
  appForgotPass,
  SendmailUserSignUp,
} = require("../mailform/register");
const Setting = require("../models/setting");
const jwt = require("jsonwebtoken"); // If using JWT

const { logUserLogin , logUserLogout} = require("../middleware/logUserActivity");

exports.userSignup = async (req, res) => {
  try {
    // Check if the phone number is already in use
    const newUser = new User(req.newUser);
    const onSetting = await Setting.findOne().exec();
    if (!onSetting.openReg) {
      return res. v.json({
        success: false,
        message: "Đang khóa đăng ký tài khoản.",
      });
    }
    await newUser.save();

    // const token = genToken(newUser);
    // SendmailUserSignUp(newUser);

    await axios.post(
      `${process.env.TELEGRAM_URL}${process.env.TELEGRAM_TOKEN_WEB}/sendMessage`,
      {
        chat_id: process.env.TELEGRAM_ID_WEB,
        text: `New User Registered:\nUsername: ${newUser.username}\nEmail: ${newUser.email}\nPhone: ${newUser.phonenumber}`,
      }
    );
    // const user = await User.findById({ _id: newUser._id }).select('username email _id rule');
    // const expiresAt = new Date();
    // expiresAt.setHours(expiresAt.getHours() + 168);

    // Respond with success
    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      // user,
      // token,
      // expiresAt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred. Please try again.",
      error: error.message,
    });
  }
};

exports.userLogin = async (req, res) => {
  const email = req.body.email.toLowerCase();
  let regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

  try {
    let foundUser = null;
    if (email.match(regexEmail)) {
      foundUser = await User.findOne({ email });
    } else {
      foundUser = await User.findOne({ phonenumber: email });
    }
    if (!foundUser) {
      res.status(403).json({
        success: false,
        message: "Email hoặc số điện thoại không tồn tại",
        passErr: false,
        emailErr: true,
      });
      return;
    }
    // eslint-disable-next-line no-lonely-if
    else if (
      foundUser.comparePassword(req.body.password) &&
      !foundUser.private
    ) {
      const token = genToken(foundUser);
      const user = await User.findById({ _id: foundUser._id }).select(
        "username email _id rule"
      );
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 168);

      await logUserLogin(foundUser, req, token);

      res.status(200).json({
        success: true,
        token,
        user,
        expiresAt,
        message: "Success",
      });
    } else {
      res.status(403).json({
        success: false,
        message: "Sai mật khẩu, xin vui lòng thử lại.",
        emailErr: false,
        passErr: true,
      });
    }
  } catch (err) {
    res.status(500).json({
      error: err,
      success: false,
      message: "Please check correctness and try again",
    });
  }
};

exports.checkIfregister = async (req, res) => {
  const phonenumber = req.body.phonenumber;
  try {
    const user = await User.findOne({ phonenumber });
    if (user) {
      res.status(200).json({
        success: true,
      });
    } else {
      res.status(200).json({
        success: false,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.checkIfEmailRegister = async (req, res) => {
  const email = req.body.email;
  try {
    const user = await User.findOne({ email });
    if (user) {
      res.status(200).json({
        success: true,
      });
    } else {
      res.status(200).json({
        success: false,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.userProfile = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  try {
    // eslint-disable-next-line no-underscore-dangle
    const id = req.user._id;
    const user = await User.findById({ _id: id }).select(
      "username email phonenumber rule"
    );
    ForbiddenError.from(ability).throwUnlessCan("read", user);
    res.json({
      success: true,
      user,
      message: "success",
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};


exports.CreateToken = async (req, res) => {
  try {
    const { sessionToken } = req.body;
    
    if (!sessionToken) {
      return res.status(400).json({ success: false, message: "Missing sessionToken" });
    }
    const decoded = jwt.decode(sessionToken);
    
    if (!decoded || !decoded.exp) {
      return res.status(400).json({ success: false, message: "Invalid token or missing expiration" });
    }
    const expiresAt = new Date(decoded.exp * 1000);

    const newToken = new Token({ sessionToken, sessionTokenExpiresAt: expiresAt });
    await newToken.save();

    const user = req.user;

    await logUserLogout(user, req, sessionToken);

    res.json({ success: true, message: "Token created successfully" });
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: err.message });
  }
};

exports.userStoreAddress = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  try {
    // eslint-disable-next-line no-underscore-dangle
    const id = req.user._id;
    const store = await User.findById({ _id: id }).select("store");
    ForbiddenError.from(ability).throwUnlessCan("read", store);
    res.json({
      success: true,
      store,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.getStoreInfomation = async (req, res) => {
  const { id } = req.params;
  try {
    const store = await User.findById({ _id: id }).select(
      "store avatar followers following"
    );
    res.json({
      success: true,
      store,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.userStoreEdit = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  const userId = req.user._id;
  const { name, bio, street, village, district, city, phoneNumber } = req.body;
  try {
    const user = await User.findById({ _id: userId }).select(
      "username email avatar bio phonenumber gender idname store"
    );
    ForbiddenError.from(ability).throwUnlessCan("update", user);
    if (user) {
      user.store.name = name;
      user.store.bio = bio;
      user.store.street = street;
      user.store.village = village;
      user.store.district = district;
      user.store.city = city;
      user.store.phoneNumber = phoneNumber;
    }
    await user.save();
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    res.json(500).status({
      error: err,
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.AppForgotPassword = async (req, res) => {
  const email = req.body.email.toLowerCase();
  const nanoid = customAlphabet("1234567890abcdef", 8);

  try {
    // Find the user by email
    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      res.status(403).json({
        success: false,
        error: "Địa chỉ email không tồn tại",
      });
      return;
    }

    // Check if the user already has a passcode
    if (foundUser.Passcode) {
      // Remove the old passcode
      await Passcode.findByIdAndDelete(foundUser.Passcode);
    }

    // Create a new passcode
    const code = new Passcode({
      code: nanoid(),
    });
    await code.save();

    // Update the user with the new passcode
    await foundUser.updateOne({
      Passcode: code._id,
    });

    // Generate email content and send it
    // const html = appForgotPass(foundUser.username, code.code);
    // await mailer.sendEmail(email, "Quên mật khẩu", html);
    appForgotPass(foundUser, code.code);

    // Send response to client
    res.status(200).json({
      success: true,
      message: "Sended",
    });
  } catch (err) {
    res.status(500).json({
      message: "something went wrong !!!",
      success: false,
    });
  }
};

exports.appResetPassword = async (req, res) => {
  const { password, code } = req.body;
  const email = req.body.email.toLowerCase();
  const regPass = password.match(/^(?=.{8,})/);
  try {
    const foundUser = await User.findOne({ email }).populate(
      "Passcode",
      "code"
    );
    if (foundUser.Passcode.code === code) {
      // eslint-disable-next-line no-unused-expressions
      if (!regPass) {
        res.status(403).json({
          success: false,
          error:
            "Password must contain at least: 1 uppercase, 1 lowercase, 1 number",
        });
        return;
      } else {
        bcrypt.hash(password, 10, async (err, hash) => {
          if (err) {
            res.status(500).json({
              error: err,
              message: "Something went wrong",
            });
          } else {
            foundUser.password = hash;
            await foundUser.save();
            // const html = PassChanged(foundUser.username);
            // mailer.sendEmail(email, "Change password successfully!", html);
            PassChanged(foundUser);
            res.status(200).json({
              user: foundUser,
              success: true,
              message: "Password has been change",
            });
          }
        });
      }
    } else {
      res.status(404).json({
        success: false,
        message: "Something went wrong",
      });
    }
  } catch (err) {
    res.status(500).json({
      error: err,
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.changeProfile = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  const userId = req.user._id;
  // const { email, username, phonenumber } = req.body;
  const { username } = req.body;
  try {
    const user = await User.findById({ _id: userId }).select(
      "username email phonenumber rule"
    );

    ForbiddenError.from(ability).throwUnlessCan("update", user);

    if (user) {
      // user.email = email;
      user.username = username;
      // user.phonenumber = phonenumber;
    }
    await user.save();

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    res.json(500).status({
      error: err,
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.changePassword = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  const { newPassword, password } = req.body;
  const regPass = newPassword.match(/^(?=.{8,})/);
  try {
    if (!regPass) {
      res.status(403).json({
        success: false,
        message:
          "Password must contain at least: 1 uppercase, 1 lowercase, 1 number",
      });
      return;
    }
    const foundUser = await User.findOne({ _id: req.user._id });
    ForbiddenError.from(ability).throwUnlessCan("update", foundUser);
    if (foundUser.comparePassword(password)) {
      bcrypt.hash(newPassword, 10, async (err, hash) => {
        if (err) {
          res.status(500).json({
            error: err,
            message: "Something went wrong",
          });
          return;
        }
        foundUser.password = hash;
        await foundUser.save();
        // const html = PassChanged(foundUser.username);
        // mailer.sendEmail(req.user.email, "Thay đổi mật khẩu thành công", html);
        res.status(200).json({
          success: true,
          message: "Password has been change",
        });
      });
    } else {
      res.status(403).json({
        success: false,
        message: "Old Password not correctly",
      });
    }
  } catch (err) {
    res.json(500).status({
      error: err,
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.changeAvatar = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  const userId = req.user._id;
  try {
    const width = 600;
    const option = sharp(req.file.path)
      .resize(width)
      .jpeg({
        quality: 80,
        chromaSubsampling: "4:2:0",
      })
      // .webp({lossless:true, quality: 60, alphaQuality: 80, force: false})
      .toFile(`uploads/avatar/ava_${req.file.filename}`, (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log("upload success");
        }
      });
    const user = await User.findOne({ _id: userId }).select(
      "username email avatar bio phonenumber gender idname store"
    );
    ForbiddenError.from(ability).throwUnlessCan("update", user);
    if (user) {
      user.avatar = `uploads/avatar/ava_${req.file.filename}`;
    }

    await user.save();
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    res.json(500).status({
      error: err,
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.removeAvatar = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  const userId = req.user._id;
  try {
    const user = await User.findOne({ _id: userId }).select(
      "username email avatar bio phonenumber gender idname store"
    );
    ForbiddenError.from(ability).throwUnlessCan("update", user);
    if (user) {
      user.avatar = "";
    }
    await user.save();
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    res.json(500).status({
      error: err,
      success: false,
      message: "Something went wrong",
    });
  }
};
