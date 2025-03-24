const express = require("express");

const router = express.Router();
const passport = require("passport");
const rateLimit = require("express-rate-limit");
const userController = require("../controllers/user");
const signupMiddleware = require("../middleware/signupMiddleware");
const { verifyToken } = require("../middleware/gen-token");
const checkBlacklistedToken = require("../middleware/checkBlacklistedToken");

const deviceLimiter = require("../middleware/deviceLimiter");

const upload = require("../middleware/upload-photo");
// router.get('/users', userController.user_get_all)
const createAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 1 hour window
  max: 5, // start blocking after 5 requests
  message:
    "Too many accounts created from this IP, please try again after an hour",
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Store signup attempts per device

router.post(
  "/signup",
  deviceLimiter,
  signupMiddleware,
  userController.userSignup
);

router.post("/login", deviceLimiter, userController.userLogin);

router.post("/ifregiter", userController.checkIfregister);

router.post("/ifemailregiter", userController.checkIfEmailRegister);

// router.put('/forgot-pass', createAccountLimiter, userController.forgotPassword);

router.put("/app-forgot-pass", deviceLimiter, userController.AppForgotPassword);

router.put("/app-reset-pass/", deviceLimiter, userController.appResetPassword);

router.get(
  "/user/",
  passport.authenticate("user", { session: false }), checkBlacklistedToken,
  userController.userProfile
);

router.post("/blacklist-token/", passport.authenticate("user", { session: false }), userController.CreateToken);

router.get(
  "/user/store",
  passport.authenticate("user", { session: false }),
  userController.userStoreAddress
);

router.get("/user/infomation/:id", userController.getStoreInfomation);

router.put(
  "/user/store",
  passport.authenticate("user", { session: false }),
  userController.userStoreEdit
);

router.put(
  "/user/profile",
  passport.authenticate("user", { session: false }), checkBlacklistedToken,
  upload.single("imageFile"),
  userController.changeProfile
);

// router.put('/reset/:token', createAccountLimiter, verifyToken, userController.resetPassword);

router.put(
  "/change-pass",
  passport.authenticate("user", { session: false }), checkBlacklistedToken,
  userController.changePassword
);

router.put(
  "/user/avatar",
  passport.authenticate("user", { session: false }), checkBlacklistedToken,
  upload.single("imageFile"),
  userController.changeAvatar
);

router.put(
  "/user/remove-avatar",
  passport.authenticate("user", { session: false }), checkBlacklistedToken,
  upload.single("imageFile"),
  userController.removeAvatar
);

router.put(
  "/change-pass",
  passport.authenticate("user", { session: false }), checkBlacklistedToken,
  userController.changePassword
);

module.exports = router;
