const express = require('express');

const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { accessibleRecordsPlugin } = require('@casl/mongoose');
const cors = require('cors');
const passport = require('passport');
require('./api/middleware/passport');
const path = require("path");
// const helmet = require('helmet');
// app.use(
//   helmet({
//     contentSecurityPolicy: false,
//   })
// );

mongoose.plugin(accessibleRecordsPlugin);
mongoose.set('strictQuery', true);

dotenv.config();

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true
});
mongoose.Promise = global.Promise;

app.use(cors());

app.use('/uploads', express.static(path.join(__dirname, "uploads")));

// App Use Libary
app.use(morgan('dev'));
// Log thay đổi của app Get/ Post ...
// parse application/x-www-form-urlencoded

app.use(express.json());
app.use(express.urlencoded({
  extended: true,
}));
app.use(passport.initialize());

// CROS Cross-origin resource sharing
// eslint-disable-next-line consistent-return
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});


// Import router
const userRouter = require('./api/routes/user');
const adminRouter = require('./api/routes/admin');
const settingRouter = require('./api/routes/setting');
const mediaRouter = require('./api/routes/media');
const postCatRouter = require('./api/routes/post_cat');
const postRouter = require('./api/routes/post');
const menuRouter = require('./api/routes/menu');
const videoRouter = require('./api/routes/video');


// Export router
app.use('/api/auth', userRouter);
app.use('/api/administrator', adminRouter);
app.use('/api/setting', settingRouter);
app.use('/api/media', mediaRouter);
app.use('/api/post_cat', postCatRouter);
app.use('/api/post', postRouter);
app.use('/api/menu', menuRouter);
app.use('/api/video', videoRouter);


app.get('/', (req, res) => {
  res.send('Welcome VPS!');
});
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((error, req, res) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});
  
module.exports = app;
  