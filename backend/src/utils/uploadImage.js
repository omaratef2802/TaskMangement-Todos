const cloudinary = require("../config/cloudinary");

const uploadImage = (file, userId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "todos/users",
        public_id: userId,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(file.buffer);
  });
};

module.exports = uploadImage;
