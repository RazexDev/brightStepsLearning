const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
    "video/mp4",
    "video/quicktime",
    "video/x-m4v"
  ];

  // We can also allow ANY file if the user wants "any file", but it's safer to check mime types.
  // Actually, to fully allow "any type of file", let's just accept all or a broad range:
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images, videos, and PDFs are allowed."), false);
  }
};

const uploadRoutine = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
});

module.exports = uploadRoutine;