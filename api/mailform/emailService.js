const nodemailer = require('nodemailer');
const mailer = require("../middleware/mailer");

const sendVerificationCode = async (email, code) => {
  await Promise.all([
      mailer.sendEmail(
        email,
        "Your Verification Code",
        `Your verification code is <strong>${code}</strong>. It is valid for 30 minutes.`,
      ),
    ]);
};

module.exports = { sendVerificationCode };