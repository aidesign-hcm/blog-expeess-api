/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
const jwt = require('jsonwebtoken');
const { ADMIN_SECRET, SECRET, SECRET_CHANGEPASS } = require('../config');

genToken = (user) => jwt.sign(
  {
    _id: user._id,
    username: user.username,
    email: user.email,
  },
  SECRET,
  { expiresIn: '168h' },
);

adminGenToken = (user) => jwt.sign(
  {
    _id: user._id,
    userName: user.userName,
  },
  ADMIN_SECRET,
  { expiresIn: '24h' },
);

changeToken = (user) => jwt.sign(
  {
    _id: user._id,
    email: user.email,
  },
  SECRET_CHANGEPASS,
  { expiresIn: '1h' },
);

setToken = (user) => jwt.sign(
  {
    _id: user._id,
    email: user.email,
  },
  SECRET,
);

verifyToken = function (req, res, next) {
  const resetlink = req.params.token;
  if (resetlink) {
    jwt.verify(resetlink, SECRET_CHANGEPASS, (err, decoded) => {
      if (err) {
        res.json({
          success: false,
          meassage: 'failed authentication',
        });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    res.json({
      success: false,
      message: 'token not provied',
    });
  }
};

module.exports = {
  genToken, changeToken, setToken, verifyToken, adminGenToken,
};
