const express = require("express");
const router = express.Router();
const Setting = require("../models/setting");
const { ForbiddenError } = require("@casl/ability");
const passport = require("passport");
const config = require("../config/index");
const {verifyAdmin, verifyManager}  = require('../middleware/is-admin')
const Menu = require("../models/menu");

router.get("/bank-account", async (req, res) => {
  try {
    const setting = await Setting.findOne()
      .select('momo bank momoQRCode bankQRCode')
    res.status(201).json({ success: true, setting });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/admin", passport.authenticate("user", { session: false }), async (req, res) => {
  try {
    const setting = await Setting.findOne().exec();
    res.status(201).send({ success: true, setting });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.put(
  "/",
  passport.authenticate("user", { session: false }), 
  verifyAdmin,
  async (req, res) => {
    const ability = defineAbilityFor(req.user);
    try {
      const {
        title,
        desc,
        address,
        email,
        hotline,
        contact,
        copyright,
        footerBLock1,
        footerBLock2,
        openReg,
        logo,
        ads1

      } = req.body;

      let setting = await Setting.findOne();

      if (setting) {
        ForbiddenError.from(ability).throwUnlessCan("update", setting);

        setting.title = title ?? setting.title;
        setting.desc = desc ?? setting.desc;
        setting.address = address ?? setting.address;
        setting.email = email ?? setting.email;
        setting.hotline = hotline ?? setting.hotline;
        setting.contact = contact ?? setting.contact;
        setting.copyright = copyright ?? setting.copyright;
        setting.footerBLock1 = footerBLock1 ?? setting.footerBLock1;
        setting.footerBLock2 = footerBLock2 ?? setting.footerBLock2;
        setting.openReg = openReg?? setting.openReg;
        setting.logo = logo ?? setting.logo;
        setting.ads1 = ads1 ?? setting.footerBLock2;

      
        await setting.save();
      } else {
        const newSetting = new Setting({
          title,
          desc,
          address,
          email,
          hotline,
          contact,
          copyright,
          footerBLock1,
          footerBLock2,
          openReg,
          logo,
          ads1
        });

        ForbiddenError.from(ability).throwUnlessCan("create", newSetting);
        await newSetting.save();
        setting = newSetting;  // Update reference
      }

      res.status(200).json({
        success: true,
        setting,
      });
    } catch (err) {
      console.error("Error updating settings:", err);
      res.status(500).json({
        success: false,
        message: err.message || "An error occurred",
      });
    }
  }
);


router.put(
  "/editor",
  passport.authenticate("user", { session: false }), 
  async (req, res) => {
    const ability = defineAbilityFor(req.user);
    try {
      const {
        logo,
        ads1
      } = req.body;

      let setting = await Setting.findOne();

      if (setting) {
        ForbiddenError.from(ability).throwUnlessCan("update", setting);
        setting.logo = logo ?? setting.logo;
        setting.ads1 = ads1 ?? setting.footerBLock2;

        await setting.save();
      } else {
        const newSetting = new Setting({
          logo,
          ads1
        });

        ForbiddenError.from(ability).throwUnlessCan("create", newSetting);
        await newSetting.save();
        setting = newSetting;  // Update reference
      }

      res.status(200).json({
        success: true,
        setting,
      });
    } catch (err) {
      console.error("Error updating settings:", err);
      res.status(500).json({
        success: false,
        message: err.message || "An error occurred",
      });
    }
  }
);


router.get("/", async (req, res) => {
  try {
    const onSetting = Setting.findOne().exec();
    const onMenu = Menu.find()
    let [setting, menus] = await Promise.all([
      onSetting,
      onMenu
    ]);
    res
      .status(200)
      .send({ success: true, setting, menus });
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
