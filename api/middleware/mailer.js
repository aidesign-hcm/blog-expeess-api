const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = {
  sendEmail(to, subject, html) {
    const from = process.env.MAIL_USER;
    return new Promise((resolve, reject) => {
      transporter.sendMail({
        from, subject, to, html,
      }, (err, info) => {
        if (err) reject(err);
        resolve(info);
      });
    });
  },
};
