const dbTodo = require("../modules/dbTodos");
const dbUser = require("../modules/dbUser");
const dbReminder = require("../modules/dbTodoReminder");
const mailTransport = require("../config/nodemailer");
let started = false;

const sendDueTodoReminders = async () => {
  const now = new Date();
  const upper = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const todos = await dbTodo.find({
    deletedAt: null,
    deadline: { $gt: now, $lte: upper },
  }).select("_id title deadline userId status assignedTo assignedStatuses");

  for (const todo of todos) {
    const recipients = [];
    if (todo.status !== "done") recipients.push(String(todo.userId));
    for (const assignedId of todo.assignedTo) {
      const state = todo.assignedStatuses.find(
        (entry) => String(entry.userId) === String(assignedId),
      );
      if (!state || state.status !== "done") recipients.push(String(assignedId));
    }

    for (const userId of new Set(recipients)) {
      let reminder;
      try {
        reminder = await dbReminder.findOneAndUpdate(
          { todoId: todo._id, userId, reminderType: "24-hours" },
          { $setOnInsert: { todoId: todo._id, userId, reminderType: "24-hours" } },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        );
      } catch (error) {
        if (error.code === 11000) continue;
        throw error;
      }
      if (reminder.sentAt) continue;

      try {
        const user = await dbUser.findById(userId).select("mail fname");
        if (!user || !user.mail) continue;
        await mailTransport.sendMail({
          from: process.env.Email_User,
          to: user.mail,
          subject: "Todo deadline reminder",
          text: `Hello ${user.fname || "there"}, your todo "${todo.title}" is due at ${todo.deadline.toISOString()}.`,
          html: `<p>Hello ${user.fname || "there"},</p><p>Your todo <strong>${todo.title}</strong> is due at <strong>${todo.deadline.toISOString()}</strong>.</p>`,
        });
        await dbReminder.updateOne(
          { _id: reminder._id },
          { $set: { sentAt: new Date() } },
        );
      } catch (error) {
        console.error("Todo reminder failed:", error.message);
      }
    }
  }
};

const startTodoReminderScheduler = () => {
  if (started) return;
  started = true;
  const run = () => sendDueTodoReminders().catch((error) => {
    console.error("Todo reminder scheduler failed:", error.message);
  });
  run();
  setInterval(run, 15 * 60 * 1000);
};

module.exports = { startTodoReminderScheduler, sendDueTodoReminders };
