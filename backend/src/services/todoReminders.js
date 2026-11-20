const dbTodo = require("../modules/dbTodos");
const dbUser = require("../modules/dbUser");
const dbReminder = require("../modules/dbTodoReminder");
const mailTransport = require("../config/nodemailer");
let started = false;
const sendDueTodoReminders = async () => {
  const now = new Date(), upper = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const todos = await dbTodo.find({ deletedAt: null, status: { $ne: "done" }, deadline: { $gt: now, $lte: upper } })
    .select("_id title deadline userId assignedTo");
  for (const todo of todos) {
    const recipients = [...new Set([String(todo.userId), ...todo.assignedTo.map(String)])];
    for (const userId of recipients) {
      let reminder;
      try { reminder = await dbReminder.create({ todoId: todo._id, userId, reminderType: "24-hours" }); }
      catch (error) { if (error.code === 11000) continue; throw error; }
      try {
        const user = await dbUser.findById(userId).select("mail fname");
        if (!user || !user.mail) { await dbReminder.deleteOne({ _id: reminder._id }); continue; }
        await mailTransport.sendMail({
          from: process.env.Email_User, to: user.mail, subject: "Todo deadline reminder",
          text: `Hello ${user.fname || "there"}, your todo "${todo.title}" is due at ${todo.deadline.toISOString()}.`,
          html: `<p>Hello ${user.fname || "there"},</p><p>Your todo <strong>${todo.title}</strong> is due at <strong>${todo.deadline.toISOString()}</strong>.</p>`,
        });
        await dbReminder.updateOne({ _id: reminder._id }, { $set: { sentAt: new Date() } });
      } catch (error) {
        await dbReminder.deleteOne({ _id: reminder._id });
        console.error("Todo reminder failed:", error.message);
      }
    }
  }
};
const startTodoReminderScheduler = () => {
  if (started) return;
  started = true;
  const run = () => sendDueTodoReminders().catch((error) => console.error("Todo reminder scheduler failed:", error.message));
  run();
  setInterval(run, 15 * 60 * 1000);
};
module.exports = { startTodoReminderScheduler, sendDueTodoReminders };
