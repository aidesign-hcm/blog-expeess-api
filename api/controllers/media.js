const mongoose = require("mongoose");
const { ForbiddenError } = require("@casl/ability");
const defineAbilityFor = require("../permissions/abilities");
const sharp = require("sharp");
const Media = require("../models/media");
const Images = require("../models/images");
const path = require("path");

exports.resizeImage = async (req, res, next) => {
  if (!req.file) return next();
  const filename = req.file.originalname.replace(/\..+$/, "");
  const newFilename = `thumb_${filename}-${Date.now()}.jpeg`;
  await sharp(req.file.path)
    .jpeg({
      quality: 80,
      chromaSubsampling: "4:4:4",
    })
    .resize(800, 800, {
      fit: sharp.fit.inside,
      withoutEnlargement: true,
    })
    .toFile(`uploads/media/${newFilename}`);
  req.body.image = newFilename;
  next();
};

exports.featureImg = async (req, res) => {
  try {
    const media = await new Media({
      path: `uploads/media/${req.body.image}`,
      folder: "media",
    });
    res.status(200).json({
      success: true,
      media,
      featureImg: media,
    });
  } catch (err) {
    res.json(500).status({
      error: err,
      success: false,
      message: "Something went wrong",
    });
  }
};


exports.CraeteFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File upload failed or unsupported file type.",
      });
    }

    const filePath = `uploads/file/${req.file.filename}`;

    // Save file info in the database
    const media = new Media({
      path: filePath,
      folder: "file",
    });

    await media.save();

    res.status(200).json({
      success: true,
      media,
      fileUrl: `/${filePath}`, // Ensure correct URL format
    });
  } catch (err) {
    console.error("File upload error:", err);
    res.status(500).json({
      error: err.message || "Internal server error",
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

exports.singleImg = async (req, res) => {
  try {
    // Get the original file extension
    const originalExt = path.extname(req.file.originalname);
    const filename = req.file.originalname.replace(/\..+$/, "");
    const newFilename = `thumb_${filename}-${Date.now()}${originalExt}`;

    // Use Sharp to process the image and maintain the original file type
    await sharp(req.file.path)
      .resize({ width: 500,  fit: "inside" }) // Resize smaller images to at least 200x200
      .toFile(`uploads/single/${newFilename}`)
      .then((info) => {
        console.log(info);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({
          error: err,
          success: false,
          message: "Something went wrong",
        });
      });

    const media = new Media({
      path: `uploads/single/${newFilename}`,
      folder: "single",
    });
    await media.save();
    res.status(200).json({
      success: true,
      media,
      featureImg: media,
    });
  } catch (err) {
    res.status(500).json({
      error: err,
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.singleImgNoSize = async (req, res) => {
  try {
    const media = new Media({
      path: `${req.file.path}`,
      folder: "single",
    });
    await media.save();
    res.status(200).json({
      success: true,
      media,
      featureImg: media,
    });
  } catch (err) {
    res.status(500).json({
      error: err,
      success: false,
      message: "Something went wrong",
    });
  }
};


exports.reviewImg = async (req, res) => {
  try {
    const filename = req.file.originalname.replace(/\..+$/, "");
    const newFilename = `thumb_${filename}-${Date.now()}.jpeg`;
    await sharp(req.file.path)
      .jpeg({
        quality: 80,
        chromaSubsampling: "4:2:0",
      })
      .toFile(`uploads/review/thumb_${newFilename}`);
    const media = await new Media({
      path: `uploads/review/${newFilename}`,
      folder: "review",
    });
    await media.save();
    res.status(200).json({
      success: true,
      media,
    });
  } catch (err) {
    res.json(500).status({
      error: err,
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.multiImg = async (req, res) => {
  try {
    const imageFormat = await req.files["productImage"].map((obj) => {
      const filename = obj.originalname.replace(/\..+$/, "");
      const newFilename = `thumb_${filename}-${Date.now()}.jpeg`;
      // req.file.buffer
      sharp(obj.path)
        .resize(800, 800)
        .jpeg({
          quality: 80,
          chromaSubsampling: "4:2:0",
        })
        .toFile(`uploads/media/${newFilename}`);
      const rObj = {};
      // eslint-disable-next-line dot-notation
      rObj["path"] = `uploads/media/${newFilename}`;
      return rObj;
    });
    const images = new Images({
      imgs: imageFormat,
    });
    await images.save();
    res.status(200).json({
      success: true,
      images,
    });
  } catch (err) {
    res.json(500).status({
      error: err,
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.multiImgNoCut = async (req, res) => {
  try {
    const imageFormat = await req.files["productImage"].map((obj) => {
      const filename = obj.originalname.replace(/\..+$/, "");
      const newFilename = `thumb_${filename}-${Date.now()}.jpeg`;
      // req.file.buffer
      sharp(obj.path).toFile(`uploads/slider/${newFilename}`);
      const rObj = {};
      // eslint-disable-next-line dot-notation
      rObj["path"] = `uploads/slider/${newFilename}`;
      return rObj;
    });
    const images = new Images({
      imgs: imageFormat,
    });
    await images.save();
    res.status(200).json({
      success: true,
      images,
    });
  } catch (err) {
    res.json(500).status({
      error: err,
      success: false,
      message: "Something went wrong",
    });
  }
};

// xoa san pham
exports.deletefeatureImg = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  try {
    // eslint-disable-next-line prefer-destructuring
    const id = req.body.media._id;
    console.log(req.body.media);
    const media = await Media.findById({ _id: id });
    ForbiddenError.from(ability).throwUnlessCan("delete", media);
    await media.remove();
    res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err,
    });
  }
  // eslint-disable-next-line eol-last
};
