const dbTodoActivity = require("../modules/dbTodoActivity");
const logTodoActivity = async (todoId, actorId, action, details = {}) => {
  try { return await dbTodoActivity.create({ todoId, actorId, action, details }); }
  catch (error) { console.error("Todo activity log failed:", error.message); return null; }
};
module.exports = { logTodoActivity };
