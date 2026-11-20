require("dotenv").config();
const { app } = require("./src/app");
const connectDB = require("./src/config/connectDb");
const { startTodoReminderScheduler } = require("./src/services/todoReminders");

(async function start() {
  try {
    await connectDB();
    await startTodoReminderScheduler();
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`the server run on the port ${port}`));
  } catch (error) {
    console.error("Startup failed", error);
  }
})();
