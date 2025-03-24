const bcrypt = require("bcryptjs");
const { customAlphabet } = require("nanoid");
const User = require("../models/user"); 

const signupMiddleware = async (req, res, next) => {
 
  const { password, phonenumber, username } = req.body;
  const email = req.body.email?.toLowerCase()?.trim();
  const nanoid = customAlphabet("1234567890abcdef", 8);
  // Input Validation
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex = /^(?=.{8,})/;

  if (!email || !emailRegex.test(email)) {
    return res.status(403).json({
      success: false,
      message: "Không đúng định dạng Email",
    });
  }

  if (!password || !passwordRegex.test(password)) {
    return res.status(403).json({
      success: false,
      message: "Mật khẩu phải chứa ít nhất: 1 chữ in hoa, 1 chữ thường, 1 số và có độ dài tối thiểu 8 ký tự.",
    });
  }

  try {
    if (phonenumber) {
      const existingPhoneUser = await User.findOne({ phonenumber });
      if (existingPhoneUser) {
        return res.status(403).json({
          success: false,
          message: "Số điện thoại đã được sử dụng.",
        });
      }
    }

    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      return res.status(403).json({
        success: false,
        message: "Địa chỉ email này đã được sử dụng.",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user data
    req.newUser = {
      email,
      username,
      password: hashedPassword,
      code: nanoid(),
      phonenumber: phonenumber,
    };

    next(); // Pass control to the specific API
  } catch (error) {
    console.error("Middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
    });
  }
};

module.exports = signupMiddleware;
