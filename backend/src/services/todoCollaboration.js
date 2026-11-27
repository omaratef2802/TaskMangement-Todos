const mongoose = require("mongoose");
const dbTodo = require("../modules/dbTodos");
const dbComment = require("../modules/dbTodoComment");
const dbActivity = require("../modules/dbTodoActivity");
const ApiError = require("../utils/ApiError");
const { logTodoActivity } = require("./todoActivity");
const { assertProjectAccess, assertWorkspaceAccess } = require("./organizations");

const pagination = (query = {}) => {
  const page = Number(query.page ?? 1), limit = Number(query.limit ?? 10);
  if ((query.page !== undefined && typeof query.page !== "string") ||
      (query.limit !== undefined && typeof query.limit !== "string") ||
      !Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, "Invalid pagination values");
  }
  return { page, limit, skip: (page - 1) * limit };
};
const participantTodo = async (todoId, userId, includeDeleted = false) => {
  if (!mongoose.isValidObjectId(todoId)) throw new ApiError(400, "Invalid todo ID");
  const filter = { _id: todoId };
  if (!includeDeleted) filter.deletedAt = null;
  const todo = await dbTodo.findOne(filter).select("_id userId projectId workspaceId");
  if (!todo) throw new ApiError(404, "Todo not found");
  if (todo.projectId) {
    await assertProjectAccess(todo.projectId, userId);
  } else if (todo.workspaceId) {
    await assertWorkspaceAccess(todo.workspaceId, userId);
  } else if (String(todo.userId) !== String(userId)) {
    const assigned = await dbTodo.exists({ _id: todoId, assignedTo: userId });
    if (!assigned) throw new ApiError(404, "Todo not found");
  }
  return todo;
};
const getTodoActivityService = async (todoId, userId, query = {}) => {
  await participantTodo(todoId, userId, true);
  const p = pagination(query), filter = { todoId };
  const [activities, total] = await Promise.all([
    dbActivity.find(filter).populate("actorId", "fname lname username image").sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    dbActivity.countDocuments(filter),
  ]);
  return { activities, pagination: { page: p.page, limit: p.limit, total, totalPages: Math.ceil(total / p.limit) } };
};
const getTodoCommentsService = async (todoId, userId, query = {}) => {
  await participantTodo(todoId, userId);
  const p = pagination(query), filter = { todoId };
  const [comments, total] = await Promise.all([
    dbComment.find(filter).populate("userId", "fname lname username image").sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    dbComment.countDocuments(filter),
  ]);
  return { comments, pagination: { page: p.page, limit: p.limit, total, totalPages: Math.ceil(total / p.limit) } };
};
const addTodoCommentService = async (todoId, userId, text) => {
  await participantTodo(todoId, userId);
  if (typeof text !== "string" || !text.trim() || text.trim().length > 2000) throw new ApiError(400, "Comment must be between 1 and 2000 characters");
  const comment = await dbComment.create({ todoId, userId, text: text.trim() });
  await logTodoActivity(todoId, userId, "comment_added", { commentId: comment._id });
  return comment.populate("userId", "fname lname username image");
};
const updateTodoCommentService = async (todoId, commentId, userId, text) => {
  const todo = await participantTodo(todoId, userId);
  if (!mongoose.isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment ID");
  if (typeof text !== "string" || !text.trim() || text.trim().length > 2000) throw new ApiError(400, "Comment must be between 1 and 2000 characters");
  const comment = await dbComment.findOne({ _id: commentId, todoId });
  if (!comment) throw new ApiError(404, "Comment not found");
  if (String(comment.userId) !== String(userId) && String(todo.userId) !== String(userId)) throw new ApiError(403, "You cannot edit this comment");
  const updated = await dbComment.findOneAndUpdate({ _id: commentId, todoId }, { $set: { text: text.trim() } }, { new: true, runValidators: true })
    .populate("userId", "fname lname username image");
  await logTodoActivity(todoId, userId, "comment_updated", { commentId });
  return updated;
};
const deleteTodoCommentService = async (todoId, commentId, userId) => {
  const todo = await participantTodo(todoId, userId);
  if (!mongoose.isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment ID");
  const comment = await dbComment.findOne({ _id: commentId, todoId });
  if (!comment) throw new ApiError(404, "Comment not found");
  if (String(comment.userId) !== String(userId) && String(todo.userId) !== String(userId)) throw new ApiError(403, "You cannot delete this comment");
  await dbComment.deleteOne({ _id: commentId, todoId });
  await logTodoActivity(todoId, userId, "comment_deleted", { commentId });
};
module.exports = { getTodoActivityService, getTodoCommentsService, addTodoCommentService, updateTodoCommentService, deleteTodoCommentService };
