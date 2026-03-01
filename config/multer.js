const multer = require("multer");
const path = require("path");
const fs = require("fs");

// upload folder path
const uploadPath = path.join(
  __dirname,
  "../public/uploads/products"
);

// create folder if not exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

module.exports = multer({ storage });