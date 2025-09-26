// routes/teamLeadRoutes.js
import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  // New functions for Team Task Management page
  getProjectsWithTasks,
  getTeamWithTasks,
  getDashboardStats,
  getEmployeesWithTaskStatus,
  getTaskAssignmentOverview,
  
  // Existing functions
  getVisibleProjects,
  pickProject,
  getMyProjects,
  getTeamMembers,
  assignTask,
  reassignTask,
  getMyAssignedTasks,
  submitReport,
  sendNotification,
  getEmployeeReports,
  reviewReport,
  giveFeedback,
  sendNotificationToEmployees
} from "../controllers/teamLeadController.js";

const router = express.Router();

// Apply protection middleware to all routes
router.use(protect);
router.use(authorizeRoles("teamlead"));

/* ----------------------- TEAM TASK MANAGEMENT PAGE ROUTES ----------------------- */

// Project Overview Tab
router.get("/projects/overview", getProjectsWithTasks);

// Team Management Tab
router.get("/team/with-tasks", getTeamWithTasks);

// Dashboard Statistics (for stats cards)
router.get("/dashboard/stats", getDashboardStats);

// Employee Management
router.get("/employees/task-status", getEmployeesWithTaskStatus);

// Task Assignment Overview
router.get("/tasks/assignment-overview", getTaskAssignmentOverview);

/* ----------------------- PROJECT MANAGEMENT ----------------------- */

// Get all visible projects (limited view for unassigned projects)
router.get("/projects/visible", getVisibleProjects);

// Pick/claim a project
router.put("/projects/:id/pick", pickProject);

// Get projects assigned to this teamlead (full view)
router.get("/projects/mine", getMyProjects);

/* ----------------------- TEAM MANAGEMENT ----------------------- */

// Get team members (employees only)
router.get("/team/members", getTeamMembers);

/* ----------------------- TASK MANAGEMENT ----------------------- */

// Assign task to employee
router.post("/tasks/assign", assignTask);

// Reassign task to different employee
router.put("/tasks/:id/reassign", reassignTask);

// Get tasks assigned by this teamlead
router.get("/tasks/assigned", getMyAssignedTasks);

/* ----------------------- REPORTING ----------------------- */

// Submit report (daily/monthly)
router.post("/reports", submitReport);

// Review employee report
router.put("/reports/:reportId/review", reviewReport);

// Give feedback on report
router.put("/reports/:reportId/feedback", giveFeedback);

// View employee reports
router.get("/employees/:employeeId/reports", getEmployeeReports);

/* ----------------------- NOTIFICATIONS ----------------------- */

// Send notification to admin or specific user
router.post("/notifications/send", sendNotification);

// Send notification to multiple employees
router.post("/notifications/broadcast", sendNotificationToEmployees);

export default router;