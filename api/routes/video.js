const express = require("express");
const multer = require("multer");
const path = require("path");
const Video = require("../models/video");
const passport = require('passport');
const fs = require("fs")
const mime = require("mime-types"); 

const videoDirectory = path.join(__dirname, 'uploads', 'video');

const router = express.Router();

// Set max size to 2GB
const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB in bytes

// Allowed video mime types
const allowedMimeTypes = [
  "video/mp4",
  "video/mkv",
  "video/webm",
  "video/quicktime",
  "video/mkv",
];
const allowedExtensions = [".mp4", ".mkv", ".webm", ".mov"];

// Multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/video"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}${ext}`;
    cb(null, filename);
  },
});

// File filter for mime type
const fileFilter = (req, file, cb) => {
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});

router.post(
  "/upload",
  passport.authenticate("user", { session: false }),
  upload.single("video"),
  async (req, res) => {
    try {
      const { _id } = req.user;

      if (!req.file) {
        return res
          .status(400)
          .json({ error: "No file uploaded or invalid type." });
      }

      const video = await Video.create({
        uploadedBy: _id,
        videoPath: req.file.path,
      });

      res.json({
        success: true,
        videoId: video._id
      });
    } catch (err) {
      console.log(err)
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(413)
            .json({ error: "File too large. Max size is 2GB." });
        }
      }
      res.status(500).json({ error: "Server error", detail: err.message });
    }
  }
);

// Route to serve the video page (optional: to show a simple player interface)
router.get("/v/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);

    if (!video) return res.status(404).send("Video not found");

    // Direct video URL for the player
    const streamUrl = `/api/video/stream/${id}`;

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Video Player</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#000;">
          <video controls style="max-width:100%;height:auto;">
            <source src="${streamUrl}" type="video/mp4" />
            Your browser does not support HTML5 video.
          </video>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Iframe render error:", err);
    res.status(500).send("Server error");
  }
});


// Route to serve video stream
router.get('/stream/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id); // Find the video from DB using the id

    if (!video || !video.videoPath) {
      return res.status(404).send("Video not found");
    }

    const videoPath = path.resolve(__dirname, "..", "..", video.videoPath); // Full path to the video file
    console.log("Video Path: ", videoPath);
    
    // Check if the file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).send("File does not exist");
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Get the MIME type based on the file extension using mime-types library
    const ext = path.extname(videoPath).toLowerCase();
    const mimeType = mime.lookup(ext); // Get MIME type based on the file extension

    if (!mimeType) {
      return res.status(415).send("Unsupported media type");
    }

    // Set headers to allow CORS and video content
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");
    

    // Handle Range requests (for streaming)
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const file = fs.createReadStream(videoPath, { start, end });

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": mimeType, // Use the determined MIME type
      });

      file.pipe(res);
    } else {
      // If no range is specified, stream the entire file
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": mime.lookup(videoPath) || "application/octet-stream",
        "Accept-Ranges": "bytes",
      });
      

      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (err) {
    console.error("Stream error:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
