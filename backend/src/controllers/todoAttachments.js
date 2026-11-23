const {
  addTodoAttachmentsService,
  deleteTodoAttachmentService,
} = require("../services/todoAttachments");

const uploadTodoAttachments = async (req, res, next) => {
  try {
    const attachments = await addTodoAttachmentsService(
      req.params.id,
      req.id,
      req.files,
    );
    res.status(201).json({
      message: "Attachments uploaded successfully",
      data: attachments,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTodoAttachment = async (req, res, next) => {
  try {
    const result = await deleteTodoAttachmentService(
      req.params.id,
      req.params.attachmentId,
      req.id,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadTodoAttachments,
  deleteTodoAttachment,
};
