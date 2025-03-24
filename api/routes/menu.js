const express = require('express');

const router = express.Router();
const passport = require('passport');
const menuController = require('../controllers/menu');


router.get("/libaries", passport.authenticate('user',{session: false}), menuController.getLibaries);

router.post('/', passport.authenticate('user', { session: false }), menuController.createMenu);

router.post("/get-all", passport.authenticate('user', { session: false }),  menuController.getMenu)

router.get("/:id", menuController.getOneMenu)
  
router.put("/edit", passport.authenticate('user', { session: false }), menuController.editMenu);

router.delete("/:id", passport.authenticate('user', { session: false }), menuController.deleteMenu) 


module.exports = router;
