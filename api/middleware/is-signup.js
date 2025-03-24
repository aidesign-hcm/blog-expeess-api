const signupMiddleware = require("./signupMiddleware");
const passport = require("passport");

const checkIsSignUP = (req, res, next) => {
  const { isCreateSignUp } = req.body;

  if (isCreateSignUp) {
    // Call the signup middleware
    signupMiddleware(req, res, next);
  } else {
    // Authenticate user with Passport
    passport.authenticate("user", { session: false }, (err, user, info) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Authentication error", error: err });
      }
      if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized access" });
      }
      // Attach user to request object and proceed
      req.user = user;
      next();
    })(req, res, next);
  }
};

module.exports = checkIsSignUP;
