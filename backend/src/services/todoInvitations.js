const dbInvitation = require("../modules/dbTodoInvitation");
const dbTodo = require("../modules/dbTodos");
const dbUser = require("../modules/dbUser");
const ApiError = require("../utils/ApiError");
const sendEmail = require("../utils/sendEmail");
const { assignTodoService } = require("./todos");
const { notifyUsers, emitTodoChanged } = require("./notifications");

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

const inviteToTodoService = async (todoId, ownerId, email) => {
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const todo = await dbTodo.findOne({ _id: todoId, userId: ownerId, deletedAt: null });
  if (!todo) throw new ApiError(404, "Todo not found");

  const existingUser = await dbUser.findOne({ mail: normalizedEmail }).select("_id fname lname mail");
  if (existingUser) {
    const alreadyAssigned = todo.assignedTo.some((id) => String(id) === String(existingUser._id));
    if (alreadyAssigned) return { status: "already-assigned", data: todo };
    const updatedTodo = await assignTodoService(todoId, ownerId, [String(existingUser._id)]);
    await notifyUsers([existingUser._id], {
      actorId: ownerId,
      todoId,
      type: "todo_assigned",
      title: "New task assigned",
      message: `You were assigned to "${todo.title}".`,
    });
    return { status: "assigned", data: updatedTodo };
  }

  const invitation = await dbInvitation.findOneAndUpdate(
    { todoId, email: normalizedEmail },
    { $set: { ownerId, status: "pending", acceptedBy: null, acceptedAt: null } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  const appUrl = (process.env.CLIENT_URL || "http://localhost:4200").split(",")[0].trim();
  await sendEmail(
    normalizedEmail,
    `Invitation to collaborate: ${todo.title}`,
    `<h2>You have been invited to a task</h2><p>You were invited to collaborate on <strong>${escapeHtml(todo.title)}</strong>.</p><p><a href="${appUrl}/register">Create an account or sign in</a> using this email address (${escapeHtml(normalizedEmail)}). The task will appear automatically after registration.</p>`,
  );

  return { status: "invited", invitation };
};

const acceptPendingTodoInvitations = async (user) => {
  const invitations = await dbInvitation.find({ email: user.mail.toLowerCase(), status: "pending" });
  if (!invitations.length) return;

  const acceptedIds = [];
  for (const invitation of invitations) {
    const currentTodo = await dbTodo.findOne({ _id: invitation.todoId, deletedAt: null }).select("assignedTo assignedStatuses");
    if (!currentTodo) continue;
    const alreadyAssigned = currentTodo.assignedTo.some((id) => String(id) === String(user._id));
    await dbTodo.updateOne(
      { _id: invitation.todoId, deletedAt: null },
      { $addToSet: { assignedTo: user._id } },
    );
    if (!alreadyAssigned) {
      await dbTodo.updateOne(
        { _id: invitation.todoId, deletedAt: null },
        { $push: { assignedStatuses: { userId: user._id, status: "not-started", completedAt: null } } },
      );
    }
    acceptedIds.push(invitation._id);
  }

  if (acceptedIds.length) {
    await dbInvitation.updateMany(
      { _id: { $in: acceptedIds } },
      { $set: { status: "accepted", acceptedBy: user._id, acceptedAt: new Date() } },
    );
    await Promise.all(invitations
      .filter((invitation) => acceptedIds.some((id) => String(id) === String(invitation._id)))
      .map((invitation) => emitTodoChanged(invitation.todoId, user._id, "invitation_accepted")));
    await Promise.all(invitations
      .filter((invitation) => acceptedIds.some((id) => String(id) === String(invitation._id)))
      .map((invitation) => notifyUsers([invitation.ownerId], {
        actorId: user._id,
        todoId: invitation.todoId,
        type: "todo_invitation_accepted",
        title: "Task invitation accepted",
        message: `${user.fname} ${user.lname} joined your task.`,
      })));
  }
};

const getTodoInvitationsService = async (todoId, ownerId) => {
  const todo = await dbTodo.findOne({ _id: todoId, userId: ownerId, deletedAt: null }).select("_id");
  if (!todo) throw new ApiError(404, "Todo not found");
  return dbInvitation.find({ todoId, status: "pending" })
    .select("_id email status createdAt")
    .sort({ createdAt: -1 });
};

module.exports = { inviteToTodoService, acceptPendingTodoInvitations, getTodoInvitationsService };
