const mongoose = require("mongoose");
const dbTodo = require("../modules/dbTodos");
const cloudinary = require("../config/cloudinary");
const uploadAttachment = require("../utils/uploadAttachment");
const ApiError = require("../utils/ApiError");
const { logTodoActivity } = require("./todoActivity");
const { assertProjectAccess } = require("./organizations");

const MAX_ATTACHMENTS_PER_TODO = 20;

const getAccessibleTodo = async (todoId, userId) => {
  if (!mongoose.isValidObjectId(todoId)) {
    throw new ApiError(400, "Invalid todo ID");
  }

  const todo = await dbTodo.findOne({ _id: todoId, deletedAt: null });
  if (!todo) throw new ApiError(404, "Todo not found");
  if (todo.projectId) {
    await assertProjectAccess(todo.projectId, userId);
  } else if (String(todo.userId) !== String(userId)) {
    const assigned = await dbTodo.exists({ _id: todoId, assignedTo: userId, deletedAt: null });
    if (!assigned) throw new ApiError(404, "Todo not found");
  }
  return todo;
};

const addTodoAttachmentsService = async (todoId, userId, files = []) => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new ApiError(400, "Please select at least one attachment");
  }

  const todo = await getAccessibleTodo(todoId, userId);
  if (todo.attachments.length + files.length > MAX_ATTACHMENTS_PER_TODO) {
    throw new ApiError(400, `A task can have a maximum of ${MAX_ATTACHMENTS_PER_TODO} attachments`);
  }

  const uploaded = [];
  try {
    for (const file of files) {
      uploaded.push(await uploadAttachment(file, todoId));
    }
  } catch (error) {
    await Promise.allSettled(
      uploaded.map((file) => cloudinary.uploader.destroy(file.publicId, {
        resource_type: file.resourceType,
      })),
    );
    throw new ApiError(502, "Could not upload attachments to Cloudinary");
  }

  const attachments = uploaded.map((file) => ({
    ...file,
    uploadedBy: userId,
    uploadedAt: new Date(),
  }));

  try {
    const updatedTodo = await dbTodo.findOneAndUpdate(
      { _id: todoId, deletedAt: null },
      { $push: { attachments: { $each: attachments } } },
      { new: true, runValidators: true },
    );

    if (!updatedTodo) throw new ApiError(404, "Todo not found");
    await logTodoActivity(todoId, userId, "attachment_added", {
      files: attachments.map(({ name, size }) => ({ name, size })),
    });
    return updatedTodo.attachments;
  } catch (error) {
    await Promise.allSettled(
      uploaded.map((file) => cloudinary.uploader.destroy(file.publicId, {
        resource_type: file.resourceType,
      })),
    );
    throw error;
  }
};

const deleteTodoAttachmentService = async (todoId, attachmentId, userId) => {
  const todo = await getAccessibleTodo(todoId, userId);
  const attachment = todo.attachments.id(attachmentId);

  if (!attachment) throw new ApiError(404, "Attachment not found");
  if (
    String(todo.userId) !== String(userId) &&
    String(attachment.uploadedBy) !== String(userId)
  ) {
    throw new ApiError(403, "Only the task owner or the uploader can delete this attachment");
  }

  await cloudinary.uploader.destroy(attachment.publicId, {
    resource_type: attachment.resourceType,
  });

  await dbTodo.updateOne(
    { _id: todoId, deletedAt: null },
    { $pull: { attachments: { _id: attachmentId } } },
  );

  await logTodoActivity(todoId, userId, "attachment_deleted", {
    name: attachment.name,
  });

  return { message: "Attachment deleted successfully", name: attachment.name };
};

module.exports = {
  addTodoAttachmentsService,
  deleteTodoAttachmentService,
};
