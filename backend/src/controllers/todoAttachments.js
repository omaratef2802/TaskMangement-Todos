const {
  addTodoAttachmentsService,
  deleteTodoAttachmentService,
} = require("../services/todoAttachments");
const { notifyTodoParticipants } = require("../services/notifications");

const uploadTodoAttachments = async (req, res, next) => {
  try {
    const attachments = await addTodoAttachmentsService(
      req.params.id,
      req.id,
      req.files,
    );
    await notifyTodoParticipants(req.params.id, req.id, {
      type: "attachment_added",
      title: "Task attachment added",
      message: "A new file was added to a task you participate in.",
    });
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
    await notifyTodoParticipants(req.params.id, req.id, {
      type: "attachment_deleted",
      title: "Task attachment removed",
      message: "A file was removed from a task you participate in.",
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadTodoAttachments,
  deleteTodoAttachment,
};
