const multer = require("multer");
const path = require("path");
const fs = require("fs");

const maxSize = 340 * 1024 * 1024; // 340MB

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads/file");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed file types
const allowedExtensions = ["pdf", "xlsx", "xls", "txt", "doc", "docx", "pptx", "rar", "zip"];
const allowedMimeTypes = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-excel": "xls",
    "text/plain": "txt",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-powerpoint": "pptx",
    "application/x-rar-compressed": "rar",
    "application/zip": "zip",
};

// File filter function
const fileFilter = (req, file, cb) => {
    const fileExt = path.extname(file.originalname).toLowerCase().replace(".", "");
    const mimeExt = allowedMimeTypes[file.mimetype];

    if (!allowedExtensions.includes(fileExt) || !mimeExt) {
        return cb(new Error("Invalid file type"), false);
    }

    cb(null, true);
};

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/file/");
    },
    filename: (req, file, cb) => {
        const fileExt = path.extname(file.originalname).toLowerCase().replace(".", "");
        if (!allowedExtensions.includes(fileExt)) {
            return cb(new Error("Invalid file type"));
        }

        const sanitizedFileName = file.originalname.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_.-]/g, "");
        const fileName = `${Date.now()}-${sanitizedFileName}`;
        cb(null, fileName);
    },
});

// Multer upload middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: maxSize,
        files: 1,
    },
    fileFilter: fileFilter,
});

module.exports = upload;
