const dbNotification = require("../modules/dbNotification");
const dbTodo = require("../modules/dbTodos");
const { emitToUser } = require("../config/socket");

const createNotification = async ({ userId, actorId = null, todoId = null, type, title, message }) => {
  if (!userId || (actorId && String(userId) === String(actorId))) return null;
  const notification = await dbNotification.create({ userId, actorId, todoId, type, title, message });
  const populated = await notification.populate([
    { path: "actorId", select: "fname lname username image" },
    { path: "todoId", select: "title" },
  ]);
  emitToUser(userId, "notification:new", populated);
  return populated;
};

const notifyUsers = async (userIds, payload) => {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean).map(String))];
  const results = await Promise.allSettled(uniqueIds.map((userId) => createNotification({ ...payload, userId })));
  results.filter((result) => result.status === "rejected")
    .forEach((result) => console.error("Notification creation failed:", result.reason?.message));
};

const notifyTodoParticipants = async (todoId, actorId, payload) => {
  const todo = await dbTodo.findOne({ _id: todoId }).select("userId assignedTo");
  if (!todo) return;
  await notifyUsers([todo.userId, ...todo.assignedTo], { ...payload, actorId, todoId });
};

module.exports = { createNotification, notifyUsers, notifyTodoParticipants };
