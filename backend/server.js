require("dotenv").config();
const http = require("http");
const { app } = require("./src/app");
const connectDB = require("./src/config/connectDb");
const { initSocket } = require("./src/config/socket");
const { startTodoReminderScheduler } = require("./src/services/todoReminders");

(async function start() {
  try {
    await connectDB();
    const server = http.createServer(app);
    initSocket(server);
    await startTodoReminderScheduler();
    const port = process.env.PORT || 3000;
    server.listen(port, () => console.log(`the server run on the port ${port}`));
  } catch (error) {
    console.error("Startup failed", error);
    process.exit(1);
  }
})();
