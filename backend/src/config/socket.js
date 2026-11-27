const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.SECRET);
      if (!decoded.userId) return next(new Error("Invalid token"));
      socket.userId = String(decoded.userId);
      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
    socket.emit("socket:connected", { userId: socket.userId });
  });

  return io;
};

const getIO = () => io;

const emitToUser = (userId, event, payload) => {
  if (io && userId) io.to(`user:${String(userId)}`).emit(event, payload);
};

const emitToAll = (event, payload) => { if (io) io.emit(event, payload); };

module.exports = { initSocket, getIO, emitToUser, emitToAll };
