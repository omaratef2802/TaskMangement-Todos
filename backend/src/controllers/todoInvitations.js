const { inviteToTodoService } = require("../services/todoInvitations");

const inviteToTodo = async (req, res, next) => {
  try {
    const result = await inviteToTodoService(req.params.id, req.id, req.body.email);
    res.status(result.status === "invited" ? 201 : 200).json({
      message: result.status === "invited" ? "Invitation sent successfully" : result.status === "already-assigned" ? "User is already assigned to this task" : "User assigned and notified",
      data: result.data || result.invitation,
      status: result.status,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { inviteToTodo };
