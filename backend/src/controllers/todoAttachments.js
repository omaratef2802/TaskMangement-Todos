const {
  addTodoAttachmentsService,
  deleteTodoAttachmentService,
} = require("../services/todoAttachments");
const { emitTodoChanged } = require("../services/notifications");

const uploadTodoAttachments = async (req, res, next) => {
  try {
    const attachments = await addTodoAttachmentsService(
      req.params.id,
      req.id,
      req.files,
    );
    await emitTodoChanged(req.params.id, req.id, "attachments_updated");
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
    await emitTodoChanged(req.params.id, req.id, "attachment_deleted");
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadTodoAttachments,
  deleteTodoAttachment,
};
