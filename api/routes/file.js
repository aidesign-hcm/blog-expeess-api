import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
const passport = require('passport');

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads/file");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedExtensions = [
  "pdf", "xlsx", "xls", "txt", "doc", "docx", "pptx", "rar", "zip"
];
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const fileExt = path.extname(file.originalname).toLowerCase().replace(".", "");
    if (!allowedExtensions.includes(fileExt)) {
      return cb(new Error("Invalid file type"));
    }
    const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, "_")}`;
    cb(null, fileName);
  }
});
const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase().replace(".", "");
  if (!allowedExtensions.includes(fileExt)) {
    return cb(new Error("Invalid file type"), false);
  }
  cb(null, true);
};

// Multer setup
const upload = multer({
  storage: storage,
  limits: { fileSize: 340 * 1024 * 1024 },  // 340MB
  fileFilter: fileFilter,
});

// Upload route
router.post("/upload",passport.authenticate('user', { session: false }), upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "File upload failed" });
  }
  res.json({
    success: true,
    fileUrl: `/uploads/file/${req.file.filename}`, // Adjust according to your server setup
  });
});


// Upload multiple files route
router.post("/multi", passport.authenticate('user', { session: false }), upload.array("files", 100),  (req, res) => {
  console.log(req)
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: "File upload failed" });
  }

  // Get uploaded file URLs
  const fileUrls = req.files.map(file => `/uploads/file/${file.filename}`);

  res.json({
    success: true,
    files: fileUrls, // Array of uploaded file URLs
  });
});

module.exports = router;
