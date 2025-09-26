// routes/notificationRoutes.js - Aligned with existing controller
import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  // Core notification operations (Common) - EXISTING
  sendNotification,
  getMyNotifications,
  getUnreadNotifications,
  markRead,
  markUnread,
  updateNotification,
  deleteNotification,
  
  // Stats and utility (Common) - EXISTING
  getNotificationStats,
  getAllUsers1,
  
  // Bulk operations (Common) - EXISTING
  bulkMarkRead,
  markAllRead,
  
  // Specific send operations - EXISTING
  sendNotificationToEmployees,
  sendNotificationToTeamLeads, 
  sendNotificationToAllUsers,
  
  // TeamLead specific operations - EXISTING
  getAllUsersForTeamLead,
  
  // Employee specific operations - EXISTING
  getRecipientsForEmployee,
  
  // Admin operations - EXISTING
  adminGetAllNotifications,
  adminGetNotificationStats,
  adminMarkNotificationRead,
  adminMarkNotificationUnread,
  adminBulkMarkRead,
  adminBulkMarkUnread,
  adminMarkAllNotificationsRead,
  
  // Missing functions - NEED TO ADD TO CONTROLLER
  sendNotificationToSpecificUsers,
  getTeamLeadNotifications,
  sendNotificationToTeamMembers,
  sendNotificationToColleagues,
  adminDeleteNotification,
  adminUpdateNotification,
  getNotificationAnalytics,
  exportNotifications,
  getNotificationHistory,
  purgeOldNotifications
} from "../controllers/notifcationController.js";

const router = express.Router();

/* =================== PROTECT ALL NOTIFICATION ROUTES =================== */
router.use(protect);

/* =================== COMMON OPERATIONS (All authenticated users) =================== */
router.get("/my", getMyNotifications);
router.get("/unread", getUnreadNotifications);
router.get("/stats", getNotificationStats);
router.put("/:id/read", markRead);
router.put("/:id/unread", markUnread);
router.put("/bulk/mark-read", bulkMarkRead);
router.put("/mark-all-read", markAllRead);
router.put("/:id", updateNotification);
router.delete("/:id", deleteNotification);

/* =================== EMPLOYEE SPECIFIC ROUTES =================== */
router.get("/recipients/employee", authorizeRoles("employee"), getRecipientsForEmployee);
router.post("/send-to-colleagues", authorizeRoles("employee"), sendNotificationToColleagues);

/* =================== TEAMLEAD SPECIFIC ROUTES =================== */
router.get("/users/teamlead", authorizeRoles("teamlead"), getAllUsersForTeamLead);
router.get("/teamlead/notifications", authorizeRoles("teamlead"), getTeamLeadNotifications);
router.post("/send-to-team", authorizeRoles("teamlead"), sendNotificationToTeamMembers);
router.post("/send-to-employees", authorizeRoles("admin", "teamlead"), sendNotificationToEmployees);

/* =================== ADMIN & TEAMLEAD SHARED ROUTES =================== */
router.post("/send", authorizeRoles("admin", "teamlead", "employee"), sendNotification);
router.get("/users", authorizeRoles("admin", "teamlead"), getAllUsers1);
router.post("/send-to-specific", authorizeRoles("admin", "teamlead"), sendNotificationToSpecificUsers);

/* =================== ADMIN ONLY ROUTES =================== */
// Viewing and stats
router.get("/admin/all", authorizeRoles("admin"), adminGetAllNotifications);
router.get("/admin/stats", authorizeRoles("admin"), adminGetNotificationStats);
router.get("/admin/analytics", authorizeRoles("admin"), getNotificationAnalytics);
router.get("/admin/history", authorizeRoles("admin"), getNotificationHistory);

// Read/unread management
router.put("/admin/:id/read", authorizeRoles("admin"), adminMarkNotificationRead);
router.put("/admin/:id/unread", authorizeRoles("admin"), adminMarkNotificationUnread);
router.put("/admin/bulk/mark-read", authorizeRoles("admin"), adminBulkMarkRead);
router.put("/admin/bulk/mark-unread", authorizeRoles("admin"), adminBulkMarkUnread);
router.put("/admin/mark-all-read", authorizeRoles("admin"), adminMarkAllNotificationsRead);

// Notification management
router.put("/admin/:id/update", authorizeRoles("admin"), adminUpdateNotification);
router.delete("/admin/:id", authorizeRoles("admin"), adminDeleteNotification);

// Mass send operations
router.post("/send-to-teamleads", authorizeRoles("admin"), sendNotificationToTeamLeads);
router.post("/send-to-all", authorizeRoles("admin"), sendNotificationToAllUsers);

// Advanced admin operations
router.get("/admin/export", authorizeRoles("admin"), exportNotifications);
router.delete("/admin/purge-old", authorizeRoles("admin"), purgeOldNotifications);

/* =================== UTILITY ROUTES =================== */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Notification system is operational",
    timestamp: new Date().toISOString()
  });
});

export default router;