const {
  createTodos,
  getTodoByTitleService,
  getTodoByStatusService,
  getTodoByIdService,
  getTodosService,
  getAllTodosService,
  getTodoStatsService,
  assignTodoService,
  unassignTodoService,
  getAssignedToMeService,
  getAssignedByMeService,
  getAssignableUsersService,
  updateAssignedTodoStatusService,
  submitTodoForReviewService,
  reviewTodoService,
  deleteTodoService,
  clearTodosService,
  updateTodoService,
  getDeletedTodosService,
  restoreTodoService,
  permanentlyDeleteTodoService,
} = require("../services/todos");
const collaboration = require("../services/todoCollaboration");
const { notifyUsers, notifyTodoParticipants } = require("../services/notifications");

const createTodo = async (req, res, next) => {
  try {
    const inviteEmails = Array.isArray(req.body.inviteEmails) ? [...new Set(req.body.inviteEmails.map((email) => String(email).trim().toLowerCase()).filter(Boolean))] : [];
    if (inviteEmails.length > 20) throw new (require("../utils/ApiError"))(400, "You can invite a maximum of 20 people");
    const todo = await createTodos(req.body, req.id);
    if (todo.assignedTo?.length) {
      await notifyUsers(todo.assignedTo, {
        actorId: req.id,
        todoId: todo._id,
        type: "todo_assigned",
        title: "New task assigned",
        message: `You were assigned to "${todo.title}".`,
      });
    }
    const invitationResults = [];
    if (inviteEmails.length) {
      const { inviteToTodoService } = require("../services/todoInvitations");
      for (const email of inviteEmails) {
        try {
          const result = await inviteToTodoService(String(todo._id), req.id, email);
          invitationResults.push({ email, status: result.status });
        } catch (error) {
          invitationResults.push({ email, status: "failed", message: error.message });
        }
      }
    }
    res.status(201).json({ message: "success", data: todo, invitations: invitationResults });
  } catch (err) {
    next(err);
  }
};

const getTodoByTitle = async (req, res, next) => {
  try {
    res.status(200).json({
      message: "success",
      data: await getTodoByTitleService(req.query.title, req.id),
    });
  } catch (err) {
    next(err);
  }
};

const getTodoByStatus = async (req, res, next) => {
  try {
    res.status(200).json({
      message: "success",
      data: await getTodoByStatusService(req.query.status, req.id),
    });
  } catch (err) {
    next(err);
  }
};

const getTodoById = async (req, res, next) => {
  try {
    res.status(200).json({
      message: "success",
      data: await getTodoByIdService(req.params.id, req.id, req.role === "Admin"),
    });
  } catch (err) {
    next(err);
  }
};

const getTodos = async (req, res, next) => {
  try {
    const result = await getTodosService(req.id, req.query);
    res.status(200).json({
      message: "success",
      data: result.todos,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

const getAllTodos = async (req, res, next) => {
  try {
    const result = await getAllTodosService(req.query);
    res.status(200).json({
      message: "success",
      data: result.todos,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

const getReviewQueue = async (req, res, next) => {
  try {
    const query = { ...req.query, reviewStatus: "pending" };
    const result = req.role === "Admin"
      ? await getAllTodosService(query)
      : await getTodosService(req.id, query);
    res.status(200).json({
      message: "success",
      data: result.todos,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

const getTodoStats = async (req, res, next) => {
  try {
    res.status(200).json({
      message: "success",
      data: await getTodoStatsService(req.id),
    });
  } catch (err) {
    next(err);
  }
};

const assignTodo = async (req, res, next) => {
  try {
    const todo = await assignTodoService(
      req.params.id,
      req.id,
      req.body.userIds,
    );
    await notifyUsers(req.body.userIds, {
      actorId: req.id, todoId: todo._id, type: "todo_assigned",
      title: "New task assigned", message: `You were assigned to "${todo.title}".`,
    });
    res.status(200).json({ message: "Users assigned successfully", data: todo });
  } catch (err) {
    next(err);
  }
};

const unassignTodo = async (req, res, next) => {
  try {
    const todo = await unassignTodoService(
      req.params.id,
      req.id,
      req.body.userId,
    );
    await notifyUsers([req.body.userId], {
      actorId: req.id, todoId: todo._id, type: "todo_unassigned",
      title: "Task assignment removed", message: `You were removed from "${todo.title}".`,
    });
    res.status(200).json({ message: "User unassigned successfully", data: todo });
  } catch (err) {
    next(err);
  }
};

const getAssignedToMe = async (req, res, next) => {
  try {
    const result = await getAssignedToMeService(req.id, req.query);
    res.status(200).json({
      message: "success",
      data: result.todos,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

const getAssignedByMe = async (req, res, next) => {
  try {
    const result = await getAssignedByMeService(req.id, req.query);
    res.status(200).json({
      message: "success",
      data: result.todos,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

const getAssignableUsers = async (req, res, next) => {
  try {
    const result = await getAssignableUsersService(req.id, req.query);
    res.status(200).json({
      message: "success",
      data: result.users,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

const updateAssignedTodoStatus = async (req, res, next) => {
  try {
    const todo = await updateAssignedTodoStatusService(
      req.params.id,
      req.id,
      req.body.status,
    );
    await notifyUsers([todo.userId], {
      actorId: req.id, todoId: todo._id, type: "status_updated",
      title: "Assigned task updated", message: `An assignee changed "${todo.title}" to ${req.body.status}.`,
    });
    res.status(200).json({ message: "Todo status updated successfully", data: todo });
  } catch (err) {
    next(err);
  }
};

const submitTodoForReview = async (req, res, next) => {
  try {
    const todo = await submitTodoForReviewService(req.params.id, req.id);
    await notifyUsers([todo.userId?._id || todo.userId], {
      actorId: req.id, todoId: todo._id, type: "todo_submitted_for_review",
      title: "Task submitted for review", message: `"${todo.title}" is ready for your review.`,
    });
    res.status(200).json({ message: "Task submitted for review", data: todo });
  } catch (err) { next(err); }
};

const reviewTodo = async (req, res, next) => {
  try {
    const todo = await reviewTodoService(req.params.id, req.id, req.body.decision, req.body.note, req.role === "Admin");
    await notifyTodoParticipants(todo._id, req.id, {
      type: todo.reviewStatus === "approved" ? "todo_review_approved" : "todo_changes_requested",
      title: todo.reviewStatus === "approved" ? "Task approved" : "Changes requested",
      message: todo.reviewStatus === "approved" ? `"${todo.title}" was approved.` : `Changes were requested for "${todo.title}".`,
    });
    res.status(200).json({ message: "Task review saved", data: todo });
  } catch (err) { next(err); }
};

const getDeletedTodos = async (req, res, next) => {
  try { const result = await getDeletedTodosService(req.id, req.query); res.status(200).json({ message: "success", data: result.todos, pagination: result.pagination }); }
  catch (err) { next(err); }
};
const restoreTodo = async (req, res, next) => {
  try { res.status(200).json({ message: "Todo restored successfully", data: await restoreTodoService(req.params.id, req.id) }); }
  catch (err) { next(err); }
};
const permanentlyDeleteTodo = async (req, res, next) => {
  try { res.status(200).json(await permanentlyDeleteTodoService(req.params.id, req.id)); }
  catch (err) { next(err); }
};
const getTodoActivity = async (req, res, next) => {
  try { const result = await collaboration.getTodoActivityService(req.params.id, req.id, req.query); res.status(200).json({ message: "success", data: result.activities, pagination: result.pagination }); }
  catch (err) { next(err); }
};
const getTodoComments = async (req, res, next) => {
  try { const result = await collaboration.getTodoCommentsService(req.params.todoId, req.id, req.query); res.status(200).json({ message: "success", data: result.comments, pagination: result.pagination }); }
  catch (err) { next(err); }
};
const addTodoComment = async (req, res, next) => {
  try {
    const comment = await collaboration.addTodoCommentService(req.params.todoId, req.id, req.body.text);
    await notifyTodoParticipants(req.params.todoId, req.id, {
      type: "comment_added", title: "New task comment",
      message: "A new comment was added to a task you participate in.",
    });
    res.status(201).json({ message: "Comment added successfully", data: comment });
  } catch (err) { next(err); }
};
const updateTodoComment = async (req, res, next) => {
  try { res.status(200).json({ message: "Comment updated successfully", data: await collaboration.updateTodoCommentService(req.params.todoId, req.params.commentId, req.id, req.body.text) }); }
  catch (err) { next(err); }
};
const deleteTodoComment = async (req, res, next) => {
  try { await collaboration.deleteTodoCommentService(req.params.todoId, req.params.commentId, req.id); res.status(200).json({ message: "Comment deleted successfully" }); }
  catch (err) { next(err); }
};

const deleteTodo = async (req, res, next) => {
  try {
    const todo = await deleteTodoService(req.params.id, req.id);
    await notifyUsers(todo.assignedTo, {
      actorId: req.id, todoId: todo._id, type: "todo_deleted",
      title: "Task moved to trash", message: `"${todo.title}" was moved to trash by its owner.`,
    });
    res.status(200).json({ message: "Todo moved to trash successfully" });
  } catch (err) {
    next(err);
  }
};

const clearTodo = async (req, res, next) => {
  try {
    const result = await clearTodosService(req.id);
    res.status(200).json({
      message: "Todos moved to trash successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    next(err);
  }
};

const updateTodo = async (req, res, next) => {
  try {
    const todo = await updateTodoService(req.params.id, req.id, req.body, req.role === "Admin");
    await notifyUsers(todo.assignedTo, {
      actorId: req.id, todoId: todo._id, type: "todo_updated",
      title: "Assigned task updated", message: `"${todo.title}" was updated by its owner.`,
    });
    res.status(200).json({ message: "Todo updated successfully", data: todo });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTodo,
  getTodoByTitle,
  getTodoByStatus,
  getTodoById,
  getTodos,
  getAllTodos,
  getReviewQueue,
  getTodoStats,
  assignTodo,
  unassignTodo,
  getAssignedToMe,
  getAssignedByMe,
  getAssignableUsers,
  updateAssignedTodoStatus,
  submitTodoForReview,
  reviewTodo,
  deleteTodo,
  clearTodo,
  updateTodo,
  getDeletedTodos,
  restoreTodo,
  permanentlyDeleteTodo,
  getTodoActivity,
  getTodoComments,
  addTodoComment,
  updateTodoComment,
  deleteTodoComment,
};
