require('dotenv').config();

module.exports = {
  SECRET: process.env.SECRETJSON,
  SECRET_CHANGEPASS: process.env.SECRETCHANGEPASSJSON,
  MAINURL: 'http://localhost:3030/',
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASS: process.env.MAIL_PASS,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  ACCOUNT_SECRET: process.env.ACCOUNT_SECRET,
  SECRET_CHECKOUT_CODE: process.env.SECRET_CHECKOUT_CODE,
  MAIN_WEBSITE: "http://localhost:3000/",
  ADMIN_WEBSITE: "http://localhost:8080/",
  CDN_WEBSITE: 'http://localhost:8000/',
  NAME_WEBSITE: 'HAGL',
  MAIN_LANGUAGE: 'vi'
};
