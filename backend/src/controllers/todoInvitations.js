const { inviteToTodoService, getTodoInvitationsService } = require("../services/todoInvitations");
const { emitTodoChanged } = require("../services/notifications");

const inviteToTodo = async (req, res, next) => {
  try {
    const result = await inviteToTodoService(req.params.id, req.id, req.body.email);
    if (result.status !== "invited") await emitTodoChanged(req.params.id, req.id, "assigned");
    res.status(result.status === "invited" ? 201 : 200).json({
      message: result.status === "invited" ? "Invitation sent successfully" : result.status === "already-assigned" ? "User is already assigned to this task" : "User assigned and notified",
      data: result.data || result.invitation,
      status: result.status,
    });
  } catch (error) {
    next(error);
  }
};

const getTodoInvitations = async (req, res, next) => {
  try {
    const invitations = await getTodoInvitationsService(req.params.id, req.id);
    res.status(200).json({ message: "success", data: invitations });
  } catch (error) {
    next(error);
  }
};

module.exports = { inviteToTodo, getTodoInvitations };
