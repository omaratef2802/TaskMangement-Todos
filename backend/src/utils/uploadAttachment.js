const cloudinary = require("../config/cloudinary");
const { randomUUID } = require("crypto");

const uploadAttachment = (file, todoId) => new Promise((resolve, reject) => {
  const isImage = file.mimetype.startsWith("image/");
  const resourceType = isImage ? "image" : "raw";
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");

  const stream = cloudinary.uploader.upload_stream(
    {
      folder: `todos/attachments/${todoId}`,
      public_id: `${randomUUID()}-${safeName}`,
      resource_type: resourceType,
      type: "upload",
    },
    (error, result) => {
      if (error) return reject(error);
      resolve({
        publicId: result.public_id,
        url: result.secure_url,
        name: file.originalname,
        format: result.format || "",
        mimeType: file.mimetype,
        resourceType,
        size: result.bytes,
      });
    },
  );

  stream.end(file.buffer);
});

module.exports = uploadAttachment;
