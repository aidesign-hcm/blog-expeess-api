const passport = require('passport');
const passportJWT = require('passport-jwt');

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const User = require('../models/user');
const { ADMIN_SECRET, SECRET } = require('../config');

passport.use(
  'user',
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: SECRET,
    },
    function (jwtPayload, done) {
      return User.findById(jwtPayload._id)
        .select('_id username email rule address')
        .exec()
        .then((user) => done(null, user))
        .catch((err) => done(err));
    }
  )
);

passport.use(
  'admin',
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: ADMIN_SECRET,
    },
    function (jwtPayload, done) {
      return User.findById(jwtPayload._id)
        .select('_id username rule email')
        .exec()
        .then((user) => done(null, user))
        .catch((err) => done(err));
    }
  )
);
