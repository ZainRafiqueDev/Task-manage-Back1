// controllers/notificationController.js
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// ✅ Helper: consistent error response
const handleError = (res, err, message = "Server error") => {
  console.error(err);
  return res.status(500).json({ success: false, message, error: err.message });
};

// ✅ Send notification to specific users
export const sendNotification = async (req, res) => {
  try {
    const { receivers, message, type, priority, expiresAt } = req.body;

    if (!receivers || !Array.isArray(receivers) || receivers.length === 0) {
      return res.status(400).json({ success: false, message: "Receivers are required" });
    }
    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const sender = req.user._id;
    const newNotif = await Notification.create({
      sender,
      receivers,
      message: message.trim(),
      type: type || "info",
      priority: priority || "normal",
      expiresAt: expiresAt || undefined,
    });

    await newNotif.populate("sender", "name username role");

    return res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      data: newNotif,
    });
  } catch (err) {
    return handleError(res, err, "Error sending notification");
  }
};

// ✅ Employee: Get available recipients (employees and teamleads only)
export const getRecipientsForEmployee = async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ 
        success: false, 
        message: "Only employees can access this endpoint" 
      });
    }

    // Find all users with role 'employee' or 'teamlead', excluding the current user
    const recipients = await User.find({ 
      role: { $in: ["employee", "teamlead"] },
      _id: { $ne: req.user._id } 
    }).select("name username email role");

    if (recipients.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No available recipients found" 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: `Found ${recipients.length} available recipients`,
      data: recipients 
    });
  } catch (err) {
    return handleError(res, err, "Error fetching recipients for employee");
  }
};
// ✅ Role-based user fetch
export const getAllUsers1 = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "admin") {
      filter = { role: { $in: ["employee", "teamlead"] } };
    } else if (req.user.role === "employee") {
      filter = { role: { $in: ["teamlead", "admin"] } };
    } else if (req.user.role === "teamlead") {
      filter = { role: { $in: ["admin", "employee"] } };
    } else {
      return res.status(403).json({ success: false, message: "Unauthorized role" });
    }

    const users = await User.find(filter).select("name username email role");
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    return handleError(res, err, "Error fetching users");
  }
};

// ✅ Get notifications for current user (with pagination + filters)
// ✅ Get notifications for current user (with pagination + filters) - FIXED
export const getMyNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { type, unreadOnly } = req.query;

    let filter = { receivers: req.user._id };
    if (type && type !== "all") filter.type = type;
    if (unreadOnly === "true") filter.readBy = { $ne: req.user._id };

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .populate("sender", "name username role")
      .populate("receivers", "name username role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const notificationsWithReadStatus = notifications.map((notification) => {
      const notifObj = notification.toObject();
      notifObj.isRead = notification.readBy.includes(req.user._id);
      return notifObj;
    });

    // Calculate unread count for all users
    const unreadCount = await Notification.countDocuments({
      receivers: req.user._id,
      readBy: { $ne: req.user._id }
    });

    // Return consistent response format for all users
    return res.json({
      success: true,
      data: notificationsWithReadStatus, // Changed: Use 'data' instead of 'notifications'
      unreadCount, // Added: Include unread count for all users
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      },
    });
  } catch (err) {
    return handleError(res, err, "Error fetching notifications");
  }
};

// ✅ Get unread notifications
export const getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      receivers: req.user._id,
      readBy: { $ne: req.user._id },
    })
      .populate("sender", "name username role")
      .sort({ createdAt: -1 });

    const withStatus = notifications.map((n) => ({ ...n.toObject(), isRead: false }));
    return res.json({ success: true, data: withStatus });
  } catch (err) {
    return handleError(res, err, "Error fetching unread notifications");
  }
};

// ✅ Mark notification as read
export const markRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, receivers: req.user._id },
      { $addToSet: { readBy: req.user._id } },
      { new: true }
    ).populate("sender", "name username role");

    if (!notif) {
      return res.status(404).json({ success: false, message: "Notification not found or access denied" });
    }

    return res.json({ success: true, message: "Notification marked as read", data: notif });
  } catch (err) {
    return handleError(res, err, "Error marking notification as read");
  }
};

// ✅ Mark notification as unread
export const markUnread = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, receivers: req.user._id },
      { $pull: { readBy: req.user._id } },
      { new: true }
    ).populate("sender", "name username role");

    if (!notif) {
      return res.status(404).json({ success: false, message: "Notification not found or access denied" });
    }

    return res.json({ success: true, message: "Notification marked as unread", data: notif });
  } catch (err) {
    return handleError(res, err, "Error marking notification as unread");
  }
};

// ✅ Bulk mark as read
export const bulkMarkRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ success: false, message: "Notification IDs are required" });
    }

    const result = await Notification.updateMany(
      { _id: { $in: notificationIds }, receivers: req.user._id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    return res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    return handleError(res, err, "Error bulk marking notifications as read");
  }
};

// ✅ Mark all as read
export const markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { receivers: req.user._id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    return res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    return handleError(res, err, "Error marking all notifications as read");
  }
};

// ✅ Update notification (sender or admin only)
export const updateNotification = async (req, res) => {
  try {
    const { message, type, priority } = req.body;
    let filter = { _id: req.params.id };
    if (req.user.role !== "admin") filter.sender = req.user._id;

    const updateData = {};
    if (message) updateData.message = message.trim();
    if (type) updateData.type = type;
    if (priority) updateData.priority = priority;

    const notif = await Notification.findOneAndUpdate(filter, updateData, { new: true })
      .populate("sender", "name username role");

    if (!notif) {
      return res.status(404).json({ success: false, message: "Notification not found or access denied" });
    }

    return res.json({ success: true, message: "Notification updated successfully", data: notif });
  } catch (err) {
    return handleError(res, err, "Error updating notification");
  }
};

// ✅ Delete notification (sender or admin only)
export const deleteNotification = async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    if (req.user.role !== "admin") filter.sender = req.user._id;

    const notif = await Notification.findOneAndDelete(filter);
    if (!notif) {
      return res.status(404).json({ success: false, message: "Notification not found or access denied" });
    }

    return res.json({ success: true, message: "Notification deleted successfully" });
  } catch (err) {
    return handleError(res, err, "Error deleting notification");
  }
};

// ✅ Admin only - all notifications
// Replace your existing adminGetAllNotifications function with this updated version

export const adminGetAllNotifications = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Only admin can view all notifications" 
      });
    }

    const {
      page = 1,
      limit = 20,
      type = "all",
      search = "",
      status = "all", // Add status filter for read/unread
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    // Build filter object
    let filter = {};

    // Type filter
    if (type && type !== "all") {
      filter.type = type;
    }

    // Status filter (read/unread)
    if (status && status !== "all") {
      if (status === "read") {
        filter.readBy = { $exists: true, $not: { $size: 0 } };
      } else if (status === "unread") {
        filter.$or = [
          { readBy: { $exists: false } },
          { readBy: { $size: 0 } }
        ];
      }
    }

    // Search filter
    if (search && search.trim()) {
      filter.$or = [
        { message: { $regex: search.trim(), $options: "i" } },
        { type: { $regex: search.trim(), $options: "i" } },
        { priority: { $regex: search.trim(), $options: "i" } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get notifications with populated fields
    const notifications = await Notification.find(filter)
      .populate("sender", "name email role")
      .populate("receivers", "name email role")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalNotifications = await Notification.countDocuments(filter);
    const totalPages = Math.ceil(totalNotifications / parseInt(limit));

    // Add read status and counts for each notification
    const notificationsWithStatus = notifications.map(notification => ({
      ...notification,
      isRead: notification.readBy && notification.readBy.length > 0,
      readCount: notification.readBy ? notification.readBy.length : 0,
      totalReceivers: notification.receivers ? notification.receivers.length : 0,
      unreadCount: (notification.receivers ? notification.receivers.length : 0) - (notification.readBy ? notification.readBy.length : 0)
    }));

    return res.json({
      success: true,
      notifications: notificationsWithStatus,
      pagination: {
        current: parseInt(page),
        pages: totalPages,
        total: totalNotifications,
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    return handleError(res, err, "Error fetching all notifications");
  }
};

// ✅ Notification stats
export const getNotificationStats = async (req, res) => {
  try {
    const total = await Notification.countDocuments({ receivers: req.user._id });
    const unreadCount = await Notification.countDocuments({
      receivers: req.user._id,
      readBy: { $ne: req.user._id },
    });

    return res.json({
      success: true,
      total,
      read: total - unreadCount,
      unread: unreadCount,
    });
  } catch (err) {
    return handleError(res, err, "Error fetching notification stats");
  }
};

// ✅ Send notification to all employees
export const sendNotificationToEmployees = async (req, res) => {
  try {
    const { message, type, priority, expiresAt } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const employees = await User.find({ role: "employee" }).select("_id");
    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: "No employees found" });
    }

    const receivers = employees.map((e) => e._id);
    const notif = await Notification.create({
      sender: req.user._id,
      receivers,
      message: message.trim(),
      type: type || "info",
      priority: priority || "normal",
      expiresAt: expiresAt || undefined,
    });

    await notif.populate("sender", "name username role");

    return res.status(201).json({
      success: true,
      message: `Notification sent to ${receivers.length} employees`,
      data: notif,
    });
  } catch (err) {
    return handleError(res, err, "Error sending notification to employees");
  }
};

// ✅ Send notification to all team leads
export const sendNotificationToTeamLeads = async (req, res) => {
  try {
    const { message, type, priority, expiresAt } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const teamLeads = await User.find({ role: "teamlead" }).select("_id");
    if (teamLeads.length === 0) {
      return res.status(404).json({ success: false, message: "No team leads found" });
    }

    const receivers = teamLeads.map((t) => t._id);
    const notif = await Notification.create({
      sender: req.user._id,
      receivers,
      message: message.trim(),
      type: type || "info",
      priority: priority || "normal",
      expiresAt: expiresAt || undefined,
    });

    await notif.populate("sender", "name username role");

    return res.status(201).json({
      success: true,
      message: `Notification sent to ${receivers.length} team leads`,
      data: notif,
    });
  } catch (err) {
    return handleError(res, err, "Error sending notification to team leads");
  }
};

// ✅ Send notification to all users
export const sendNotificationToAllUsers = async (req, res) => {
  try {
    const { message, type, priority, expiresAt, excludeAdmins } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    let filter = {};
    if (excludeAdmins) filter.role = { $ne: "admin" };

    const users = await User.find(filter).select("_id");
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "No users found" });
    }

    const receivers = users.map((u) => u._id);
    const notif = await Notification.create({
      sender: req.user._id,
      receivers,
      message: message.trim(),
      type: type || "info",
      priority: priority || "normal",
      expiresAt: expiresAt || undefined,
    });

    await notif.populate("sender", "name username role");

    return res.status(201).json({
      success: true,
      message: `Notification sent to ${receivers.length} users`,
      data: notif,
    });
  } catch (err) {
    return handleError(res, err, "Error sending notification to all users");
  }
};


// ✅ TeamLead: Get all users (except self)
export const getAllUsersForTeamLead = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({ success: false, message: "Only team leads can access this" });
    }

    const users = await User.find({ _id: { $ne: req.user._id } }).select("name username email role");
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    return handleError(res, err, "Error fetching users for teamlead");
  }

};
// Add these functions to your notificationController.js

/* ----------------- ADMIN SPECIFIC READ/UNREAD OPERATIONS ----------------- */

// Admin get notification stats (different from user stats)
export const adminGetNotificationStats = async (req, res) => {
  try {
    // Get total notifications count
    const totalNotifications = await Notification.countDocuments();

    // Get read notifications (notifications that have at least one user in readBy array)
    const readNotifications = await Notification.countDocuments({
      readBy: { $exists: true, $not: { $size: 0 } }
    });

    // Get unread notifications (notifications with empty readBy array or no readBy field)
    const unreadNotifications = await Notification.countDocuments({
      $or: [
        { readBy: { $exists: false } },
        { readBy: { $size: 0 } }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalNotifications,
        read: readNotifications,
        unread: unreadNotifications
      }
    });
  } catch (error) {
    console.error("Error fetching admin notification stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notification statistics"
    });
  }
};

// Admin mark specific notification as read
export const adminMarkNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    // Add admin to readBy array if not already present
    if (!notification.readBy.includes(req.user._id)) {
      notification.readBy.push(req.user._id);
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking notification as read"
    });
  }
};

// Admin mark specific notification as unread
export const adminMarkNotificationUnread = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    // Remove admin from readBy array
    notification.readBy = notification.readBy.filter(
      userId => !userId.equals(req.user._id)
    );
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as unread",
      data: notification
    });
  } catch (error) {
    console.error("Error marking notification as unread:", error);
    res.status(500).json({
      success: false,
      message: "Error marking notification as unread"
    });
  }
};

// Admin bulk mark notifications as read
export const adminBulkMarkRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      // If no specific IDs provided, mark all notifications as read
      await Notification.updateMany(
        {},
        { $addToSet: { readBy: req.user._id } }
      );

      res.status(200).json({
        success: true,
        message: "All notifications marked as read"
      });
    } else {
      // Mark specific notifications as read
      await Notification.updateMany(
        { _id: { $in: notificationIds } },
        { $addToSet: { readBy: req.user._id } }
      );

      res.status(200).json({
        success: true,
        message: `${notificationIds.length} notifications marked as read`
      });
    }
  } catch (error) {
    console.error("Error bulk marking notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking notifications as read"
    });
  }
};

// Admin bulk mark notifications as unread
export const adminBulkMarkUnread = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      // If no specific IDs provided, mark all notifications as unread
      await Notification.updateMany(
        {},
        { $pull: { readBy: req.user._id } }
      );

      res.status(200).json({
        success: true,
        message: "All notifications marked as unread"
      });
    } else {
      // Mark specific notifications as unread
      await Notification.updateMany(
        { _id: { $in: notificationIds } },
        { $pull: { readBy: req.user._id } }
      );

      res.status(200).json({
        success: true,
        message: `${notificationIds.length} notifications marked as unread`
      });
    }
  } catch (error) {
    console.error("Error bulk marking notifications as unread:", error);
    res.status(500).json({
      success: false,
      message: "Error marking notifications as unread"
    });
  }
};

// Admin mark all notifications as read
export const adminMarkAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {},
      { $addToSet: { readBy: req.user._id } }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking all notifications as read"
    });
  }
};

/* ----------------- UPDATE EXISTING ADMIN GET ALL NOTIFICATIONS FUNCTION ----------------- */

// Updated admin get all notifications with status filter
// Add these missing functions to your notificationController.js

/* ----------------- MISSING FUNCTIONS TO ADD TO CONTROLLER ----------------- */

// ✅ Send notification to specific users (different from general sendNotification)
export const sendNotificationToSpecificUsers = async (req, res) => {
  try {
    const { userIds, message, type, priority, expiresAt } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "User IDs are required" 
      });
    }

    if (!message || message.trim() === "") {
      return res.status(400).json({ 
        success: false, 
        message: "Message is required" 
      });
    }

    // Verify users exist
    const users = await User.find({ _id: { $in: userIds } }).select("_id");
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No valid users found" 
      });
    }

    const validUserIds = users.map(u => u._id);
    const notification = await Notification.create({
      sender: req.user._id,
      receivers: validUserIds,
      message: message.trim(),
      type: type || "info",
      priority: priority || "normal",
      expiresAt: expiresAt || undefined,
    });

    await notification.populate("sender", "name username role");

    return res.status(201).json({
      success: true,
      message: `Notification sent to ${validUserIds.length} users`,
      data: notification,
    });
  } catch (err) {
    return handleError(res, err, "Error sending notification to specific users");
  }
};

// ✅ TeamLead: Get team lead specific notifications
export const getTeamLeadNotifications = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({ 
        success: false, 
        message: "Only team leads can access this endpoint" 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { type, priority } = req.query;

    let filter = { 
      $or: [
        { receivers: req.user._id }, // Notifications received by teamlead
        { sender: req.user._id }     // Notifications sent by teamlead
      ]
    };

    if (type && type !== "all") filter.type = type;
    if (priority && priority !== "all") filter.priority = priority;

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .populate("sender", "name username role")
      .populate("receivers", "name username role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const notificationsWithStatus = notifications.map((notification) => {
      const notifObj = notification.toObject();
      notifObj.isRead = notification.readBy.includes(req.user._id);
      notifObj.isSentByMe = notification.sender._id.equals(req.user._id);
      return notifObj;
    });

    return res.json({
      success: true,
      data: notificationsWithStatus,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      },
    });
  } catch (err) {
    return handleError(res, err, "Error fetching team lead notifications");
  }
};

// ✅ TeamLead: Send notification to team members
export const sendNotificationToTeamMembers = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({ 
        success: false, 
        message: "Only team leads can send to team members" 
      });
    }

    const { message, type, priority, expiresAt } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({ 
        success: false, 
        message: "Message is required" 
      });
    }

    // Get all employees (team members) - assuming teamlead manages employees
    const teamMembers = await User.find({ role: "employee" }).select("_id");
    if (teamMembers.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No team members found" 
      });
    }

    const receivers = teamMembers.map(member => member._id);
    const notification = await Notification.create({
      sender: req.user._id,
      receivers,
      message: message.trim(),
      type: type || "info",
      priority: priority || "normal",
      expiresAt: expiresAt || undefined,
    });

    await notification.populate("sender", "name username role");

    return res.status(201).json({
      success: true,
      message: `Notification sent to ${receivers.length} team members`,
      data: notification,
    });
  } catch (err) {
    return handleError(res, err, "Error sending notification to team members");
  }
};

// ✅ Employee: Send notification to colleagues
export const sendNotificationToColleagues = async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ 
        success: false, 
        message: "Only employees can send to colleagues" 
      });
    }

    const { message, type, priority, expiresAt, colleagueIds } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({ 
        success: false, 
        message: "Message is required" 
      });
    }

    let receivers = [];

    if (colleagueIds && Array.isArray(colleagueIds) && colleagueIds.length > 0) {
      // Send to specific colleagues
      const colleagues = await User.find({ 
        _id: { $in: colleagueIds },
        role: { $in: ["employee", "teamlead"] }
      }).select("_id");
      receivers = colleagues.map(c => c._id);
    } else {
      // Send to all colleagues (employees and teamleads, excluding self)
      const colleagues = await User.find({ 
        role: { $in: ["employee", "teamlead"] },
        _id: { $ne: req.user._id }
      }).select("_id");
      receivers = colleagues.map(c => c._id);
    }

    if (receivers.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No colleagues found" 
      });
    }

    const notification = await Notification.create({
      sender: req.user._id,
      receivers,
      message: message.trim(),
      type: type || "info",
      priority: priority || "normal",
      expiresAt: expiresAt || undefined,
    });

    await notification.populate("sender", "name username role");

    return res.status(201).json({
      success: true,
      message: `Notification sent to ${receivers.length} colleagues`,
      data: notification,
    });
  } catch (err) {
    return handleError(res, err, "Error sending notification to colleagues");
  }
};

// ✅ Admin: Delete any notification
export const adminDeleteNotification = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Only admin can delete any notification" 
      });
    }

    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification not found" 
      });
    }

    return res.json({ 
      success: true, 
      message: "Notification deleted successfully" 
    });
  } catch (err) {
    return handleError(res, err, "Error deleting notification");
  }
};

// ✅ Admin: Update any notification
export const adminUpdateNotification = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Only admin can update any notification" 
      });
    }

    const { message, type, priority, expiresAt } = req.body;
    const updateData = {};
    
    if (message !== undefined) updateData.message = message.trim();
    if (type !== undefined) updateData.type = type;
    if (priority !== undefined) updateData.priority = priority;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt || null;

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("sender", "name username role");

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification not found" 
      });
    }

    return res.json({ 
      success: true, 
      message: "Notification updated successfully", 
      data: notification 
    });
  } catch (err) {
    return handleError(res, err, "Error updating notification");
  }
};

// ✅ Admin: Get notification analytics
export const getNotificationAnalytics = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Only admin can view analytics" 
      });
    }

    const { period = "7days" } = req.query;
    let dateFilter = {};

    // Set date filter based on period
    const now = new Date();
    switch (period) {
      case "24hours":
        dateFilter = { createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) } };
        break;
      case "7days":
        dateFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case "30days":
        dateFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case "90days":
        dateFilter = { createdAt: { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) } };
        break;
      default:
        dateFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
    }

    // Get analytics data
    const [
      totalNotifications,
      notificationsByType,
      notificationsByPriority,
      readVsUnread,
      topSenders,
      dailyStats
    ] = await Promise.all([
      // Total notifications in period
      Notification.countDocuments(dateFilter),
      
      // Notifications by type
      Notification.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Notifications by priority
      Notification.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Read vs Unread
      Notification.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalNotifications: { $sum: 1 },
            readNotifications: {
              $sum: {
                $cond: [{ $gt: [{ $size: "$readBy" }, 0] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalNotifications: 1,
            readNotifications: 1,
            unreadNotifications: { 
              $subtract: ["$totalNotifications", "$readNotifications"] 
            }
          }
        }
      ]),
      
      // Top senders
      Notification.aggregate([
        { $match: dateFilter },
        { 
          $lookup: {
            from: "users",
            localField: "sender",
            foreignField: "_id",
            as: "senderInfo"
          }
        },
        { $unwind: "$senderInfo" },
        {
          $group: {
            _id: "$sender",
            name: { $first: "$senderInfo.name" },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      
      // Daily statistics for the period
      Notification.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ])
    ]);

    return res.json({
      success: true,
      data: {
        period,
        totalNotifications,
        notificationsByType,
        notificationsByPriority,
        readVsUnread: readVsUnread[0] || { totalNotifications: 0, readNotifications: 0, unreadNotifications: 0 },
        topSenders,
        dailyStats
      }
    });
  } catch (err) {
    return handleError(res, err, "Error fetching notification analytics");
  }
};

// ✅ Admin: Export notifications
export const exportNotifications = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Only admin can export notifications" 
      });
    }

    const { format = "json", startDate, endDate, type } = req.query;
    
    let filter = {};
    
    // Date filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Type filter
    if (type && type !== "all") filter.type = type;

    const notifications = await Notification.find(filter)
      .populate("sender", "name username role")
      .populate("receivers", "name username role")
      .sort({ createdAt: -1 })
      .lean();

    const exportData = notifications.map(notif => ({
      id: notif._id,
      message: notif.message,
      type: notif.type,
      priority: notif.priority,
      sender: notif.sender?.name || "System",
      senderRole: notif.sender?.role || "system",
      receiversCount: notif.receivers?.length || 0,
      readByCount: notif.readBy?.length || 0,
      createdAt: notif.createdAt,
      expiresAt: notif.expiresAt
    }));

    if (format === "csv") {
      // Convert to CSV format
      const csvHeader = "ID,Message,Type,Priority,Sender,Sender Role,Receivers Count,Read By Count,Created At,Expires At\n";
      const csvRows = exportData.map(row => 
        `"${row.id}","${row.message}","${row.type}","${row.priority}","${row.sender}","${row.senderRole}",${row.receiversCount},${row.readByCount},"${row.createdAt}","${row.expiresAt || ''}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="notifications-${Date.now()}.csv"`);
      return res.send(csvHeader + csvRows);
    }

    return res.json({
      success: true,
      data: exportData,
      count: exportData.length
    });
  } catch (err) {
    return handleError(res, err, "Error exporting notifications");
  }
};

// ✅ Admin: Get notification history
export const getNotificationHistory = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Only admin can view notification history" 
      });
    }

    const { userId, days = 30 } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    let filter = {
      createdAt: {
        $gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000)
      }
    };

    // Filter by specific user if provided
    if (userId) {
      filter.$or = [
        { sender: userId },
        { receivers: userId }
      ];
    }

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .populate("sender", "name username role")
      .populate("receivers", "name username role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const history = notifications.map(notif => {
      const obj = notif.toObject();
      obj.readCount = notif.readBy?.length || 0;
      obj.unreadCount = (notif.receivers?.length || 0) - obj.readCount;
      return obj;
    });

    return res.json({
      success: true,
      data: history,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      },
    });
  } catch (err) {
    return handleError(res, err, "Error fetching notification history");
  }
};

// ✅ Admin: Purge old notifications
export const purgeOldNotifications = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Only admin can purge notifications" 
      });
    }

    const { olderThanDays = 90 } = req.body;
    
    const cutoffDate = new Date(Date.now() - parseInt(olderThanDays) * 24 * 60 * 60 * 1000);
    
    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    return res.json({
      success: true,
      message: `${result.deletedCount} old notifications purged`,
      deletedCount: result.deletedCount,
      cutoffDate
    });
  } catch (err) {
    return handleError(res, err, "Error purging old notifications");
  }
};