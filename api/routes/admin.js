const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const passport = require('passport')
const {verifyAdmin, verifyManager}  = require('../middleware/is-admin')
const checkBlacklistedToken = require("../middleware/checkBlacklistedToken");

router.post("/signup", passport.authenticate('user', { session: false }), checkBlacklistedToken, verifyAdmin,adminController.userSignup);

router.post("/users/", passport.authenticate('user',{session: false}), checkBlacklistedToken, verifyAdmin, adminController.get_all_user);

router.post("/users/search", passport.authenticate('user',{session: false}),checkBlacklistedToken , verifyAdmin, adminController.search_user);

router.get("/users/:id", passport.authenticate('user',{session: false}), checkBlacklistedToken, verifyAdmin, adminController.get_single_user);

router.delete("/users/:id", passport.authenticate('user',{session: false}), checkBlacklistedToken, verifyAdmin, adminController.delete_user);

router.put('/users/change-pass/', passport.authenticate('user',{session: false}), checkBlacklistedToken, verifyAdmin, adminController.admin_change_password)

router.post("/refesh-user", passport.authenticate('user',{session: false}), checkBlacklistedToken,verifyAdmin, adminController.refesh_user);

router.put('/change-email/:id', passport.authenticate('user',{session: false}),checkBlacklistedToken,  verifyAdmin, adminController.admin_change_email)

router.put('/update-private', passport.authenticate('user',{session: false}), checkBlacklistedToken, verifyAdmin, adminController.admin_update_user_private)

router.get('/userselect', adminController.getAllUserForSelect);

router.post("/products/", passport.authenticate('user',{session: false}), checkBlacklistedToken, verifyAdmin, adminController.getProducts);

router.post("/products/search", passport.authenticate('user',{session: false}), checkBlacklistedToken, verifyAdmin, adminController.searchProducts);

router.put('/change-info/', passport.authenticate('user',{session: false}), checkBlacklistedToken, verifyAdmin, adminController.adminChangeInfo)

router.get('/log/:id', passport.authenticate('user',{session: false}), checkBlacklistedToken, verifyAdmin, adminController.getUserLog)

module.exports = router;
