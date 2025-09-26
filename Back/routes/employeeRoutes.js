// routes/employeeRoutes.js
import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

// Import the new employee dashboard controller
import {
  getDashboardOverview,
  getMyProjects,
  getProjectDetails,
  getMyTasks,
  getTaskDetails,
  logTimeOnTask,
  updateTaskStatus,
  addTaskResponse,
  getMyPerformance,
  getMyReports,
  submitDailyReport,
  createReport,
  getMyNotifications,
  getMyAssets,
  requestAssetReturn
} from "../controllers/employeeController.js";

// Import notification controllers for common operations
import {
  markRead,
  markUnread,
  bulkMarkRead,
  markAllRead,
  getNotificationStats,
  sendNotification
} from "../controllers/notifcationController.js";

const router = express.Router();

// Protect all routes and ensure only employees can access
router.use(protect, authorizeRoles("employee"));

/* ==================== DASHBOARD OVERVIEW ==================== */
router.get("/dashboard", getDashboardOverview);

/* ==================== PROJECTS TAB ==================== */
router.get("/projects", getMyProjects);
router.get("/projects/:projectId", getProjectDetails);

/* ==================== TASKS TAB ==================== */
router.get("/tasks", getMyTasks);
router.get("/tasks/:taskId", getTaskDetails);
router.post("/tasks/:taskId/log-time", logTimeOnTask);
router.patch("/tasks/:taskId/status", updateTaskStatus);
router.post("/tasks/:taskId/response", addTaskResponse);

/* ==================== PERFORMANCE TAB ==================== */
router.get("/performance", getMyPerformance);

/* ==================== REPORTS TAB ==================== */
router.get("/reports", getMyReports);
router.post("/reports/daily", submitDailyReport);
router.post("/reports", createReport);

/* ==================== NOTIFICATIONS ==================== */
router.get("/notifications", getMyNotifications);
router.get("/notifications/stats", getNotificationStats);
router.put("/notifications/:id/read", markRead);
router.put("/notifications/:id/unread", markUnread);
router.put("/notifications/bulk/mark-read", bulkMarkRead);
router.put("/notifications/mark-all-read", markAllRead);
router.post("/notifications/send", sendNotification); // Employee can send to teamlead/admin

/* ==================== ASSETS ==================== */
router.get("/assets", getMyAssets);
router.post("/assets/:assetId/request-return", requestAssetReturn);

export default router;