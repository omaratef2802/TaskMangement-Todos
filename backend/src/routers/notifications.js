const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearNotifications,
} = require("../controllers/notification");

router.use(auth);
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);
router.delete("/clear", clearNotifications);
router.delete("/:id", deleteNotification);

module.exports = router;
