const mongoose = require("mongoose");
const dbNotification = require("../modules/dbNotification");
const ApiError = require("../utils/ApiError");

const pagination = (query = {}) => {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  if ((query.page !== undefined && typeof query.page !== "string") ||
      (query.limit !== undefined && typeof query.limit !== "string") ||
      !Number.isInteger(page) || page < 1 ||
      !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, "Invalid pagination values");
  }
  return { page, limit, skip: (page - 1) * limit };
};

const getNotifications = async (req, res, next) => {
  try {
    const p = pagination(req.query);
    const filter = { userId: req.id };
    if (req.query.isRead !== undefined) {
      if (!["true", "false"].includes(req.query.isRead)) throw new ApiError(400, "isRead must be true or false");
      filter.isRead = req.query.isRead === "true";
    }
    const [notifications, total, unreadCount] = await Promise.all([
      dbNotification.find(filter)
        .populate("actorId", "fname lname username image")
        .populate("todoId", "title")
        .sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
      dbNotification.countDocuments(filter),
      dbNotification.countDocuments({ userId: req.id, isRead: false }),
    ]);
    res.status(200).json({
      message: "success",
      data: notifications,
      unreadCount,
      pagination: { page: p.page, limit: p.limit, total, totalPages: Math.ceil(total / p.limit) },
    });
  } catch (error) { next(error); }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await dbNotification.countDocuments({ userId: req.id, isRead: false });
    res.status(200).json({ message: "success", data: { unreadCount: count } });
  } catch (error) { next(error); }
};

const markNotificationRead = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid notification ID");
    const notification = await dbNotification.findOneAndUpdate(
      { _id: req.params.id, userId: req.id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true },
    );
    if (!notification) throw new ApiError(404, "Notification not found");
    res.status(200).json({ message: "Notification marked as read", data: notification });
  } catch (error) { next(error); }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await dbNotification.updateMany(
      { userId: req.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );
    res.status(200).json({ message: "All notifications marked as read", modifiedCount: result.modifiedCount });
  } catch (error) { next(error); }
};

const deleteNotification = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid notification ID");
    const result = await dbNotification.deleteOne({ _id: req.params.id, userId: req.id });
    if (!result.deletedCount) throw new ApiError(404, "Notification not found");
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) { next(error); }
};

const clearNotifications = async (req, res, next) => {
  try {
    const result = await dbNotification.deleteMany({ userId: req.id });
    res.status(200).json({ message: "Notifications cleared successfully", deletedCount: result.deletedCount });
  } catch (error) { next(error); }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearNotifications,
};
