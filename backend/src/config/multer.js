const multer = require("multer");
const ApiError = require("../utils/ApiError");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      return cb(new ApiError(400, "the type not allowed"));
    }
    cb(null, true);
  },
});

module.exports = upload;
