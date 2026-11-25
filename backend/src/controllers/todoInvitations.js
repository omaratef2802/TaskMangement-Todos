const { inviteToTodoService } = require("../services/todoInvitations");

const inviteToTodo = async (req, res, next) => {
  try {
    const result = await inviteToTodoService(req.params.id, req.id, req.body.email);
    res.status(result.status === "assigned" ? 200 : 201).json({
      message: result.status === "assigned" ? "User assigned and notified" : "Invitation sent successfully",
      data: result.data || result.invitation,
      status: result.status,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { inviteToTodo };
