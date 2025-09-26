// routes/adminRoutes.js
import express from "express";
import { Project } from "../models/Project.js";
import User from "../models/User.js";

// User functions
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  promoteUser ,
  getAllUsersFiltered,
  getEmployees,
  assignTeam
} from "../controllers/userController.js"; 

// Project functions
import { 
  getAllProjects, 
  addProject, 
  getProjectById,
  updateProject, 
  deleteProject,
  // Advanced project APIs
  addPayment,
  updatePayment,
  deletePayment,
  addTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  updateClientStatus,
  assignTeamLead,
  assignEmployees,
  // Project Details
  addProjectDetails,
  getProjectDetails,
  updateProjectDetails,
  deleteProjectDetails,
  // Project Groups
  addProjectGroup,
  getAllProjectGroups,
  updateProjectGroup,
  deleteProjectGroup,
  recalculateProject
} from "../controllers/ProjectController.js";

// Task functions
import { 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask 
} from "../controllers/TaskController.js";

// Asset functions
import { 
  getAssets, 
  createAsset, 
  updateAsset, 
  deleteAsset, 
  assignAsset 
} from "../controllers/assetController.js";

// Report functions
import { 
  getReportsForAdmin,
  createReport,
    getUsersForReports
} from "../controllers/reportController.js";

// Fixed import: notification controller (note the typo fix)
import {
  // Core notification operations
  sendNotification,
  getMyNotifications,
  getUnreadNotifications,
  markRead,
  markUnread,
  updateNotification,
  deleteNotification,
  
  // Stats and utility
  getNotificationStats,
  getAllUsers1,
  
  // Bulk operations
  sendNotificationToEmployees,
  sendNotificationToTeamLeads,
  sendNotificationToAllUsers,
  bulkMarkRead,
  markAllRead,
  
  // Admin operations
  adminGetAllNotifications
} from "../controllers/notifcationController.js"; // Fixed typo: was "notifcationController.js"

// Admin Stats
import { getAdminStats } from "../controllers/adminController.js";

// Middleware
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ----------------- PROTECT ALL ADMIN ROUTES ----------------- */
router.use(protect, authorizeRoles("admin"));

/* ----------------- USER MANAGEMENT ----------------- */
router.get("/users", getAllUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.put("/users/:id/promote", promoteUser);

/* ----------------- PROJECTS - BASIC CRUD ----------------- */
router.get("/projects", getAllProjects);
router.post("/projects", addProject);
router.get("/projects/:id", getProjectById);
router.put("/projects/:id", updateProject);
router.delete("/projects/:id", deleteProject);

/* ----------------- PROJECT DETAILS ----------------- */
router.post("/projects/:projectId/details", addProjectDetails);
router.get("/projects/:projectId/details", getProjectDetails);
router.put("/projects/:projectId/details/:detailId", updateProjectDetails);
router.delete("/projects/:projectId/details/:detailId", deleteProjectDetails);

/* ----------------- PAYMENTS ----------------- */
router.post("/projects/:projectId/payments", addPayment);
router.put("/projects/:projectId/payments/:paymentId", updatePayment);
router.delete("/projects/:projectId/payments/:paymentId", deletePayment);

/* ----------------- TIME ENTRIES ----------------- */
router.post("/projects/:projectId/time-entries", addTimeEntry);
router.put("/projects/:projectId/time-entries/:timeEntryId", updateTimeEntry);
router.delete("/projects/:projectId/time-entries/:timeEntryId", deleteTimeEntry);

/* ----------------- MILESTONES ----------------- */
router.post("/projects/:projectId/milestones", addMilestone);
router.put("/projects/:projectId/milestones/:milestoneId", updateMilestone);
router.delete("/projects/:projectId/milestones/:milestoneId", deleteMilestone);

/* ----------------- CLIENT STATUS ----------------- */
router.put("/projects/:projectId/client-status", updateClientStatus);

/* ----------------- TEAM MANAGEMENT ----------------- */
router.put("/projects/:projectId/teamlead", assignTeamLead);
router.put("/projects/:projectId/employees", assignEmployees);

/* ----------------- PROJECT GROUPS ----------------- */
router.post("/project-groups", addProjectGroup);
router.get("/project-groups", getAllProjectGroups);
router.put("/project-groups/:id", updateProjectGroup);
router.delete("/project-groups/:id", deleteProjectGroup);

/* ----------------- TASKS ----------------- */
router.get("/tasks", getTasks);
router.post("/tasks", createTask);
router.put("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);

/* ----------------- ASSETS ----------------- */
router.get("/assets", getAssets);
router.post("/assets", createAsset);
router.put("/assets/:id", updateAsset);
router.delete("/assets/:id", deleteAsset);
router.post("/assets/:assetId/assign", assignAsset);

/* ----------------- REPORTS ----------------- */
router.get("/reports", getReportsForAdmin);
router.post("/reports", createReport);  

/* ----------------- NOTIFICATIONS - ADMIN ACCESS ----------------- */

// Core notification operations (Admin can access all)
router.post("/notifications/send", sendNotification);
router.get("/notifications/my", getMyNotifications);
router.get("/notifications/unread", getUnreadNotifications);
router.get("/notifications/stats", getNotificationStats);

// Individual notification operations
router.put("/notifications/:id/read", markRead);
router.put("/notifications/:id/unread", markUnread);
router.put("/notifications/:id", updateNotification);
router.delete("/notifications/:id", deleteNotification);

// Bulk operations
router.put("/notifications/bulk/mark-read", bulkMarkRead);
router.put("/notifications/mark-all-read", markAllRead);

// User lookup for notifications
router.get("/notifications/users", getAllUsers1);

// Send to specific groups (Admin can send to anyone)
router.post("/notifications/send-to-employees", sendNotificationToEmployees);
router.post("/notifications/send-to-teamleads", sendNotificationToTeamLeads);
router.post("/notifications/send-to-all", sendNotificationToAllUsers);

// Admin view all notifications
router.get("/notifications/admin/all", adminGetAllNotifications);

/* ----------------- ADMIN STATS ----------------- */
router.get("/stats", getAdminStats);

/* ----------------- PROJECT UTILITIES ----------------- */
router.put("/projects/:projectId/recalculate", recalculateProject);

// Utility function to fix existing projects
export const fixAllProjectCalculations = async (req, res) => {
  try {
    const projects = await Project.find();
    let fixedCount = 0;

    for (const project of projects) {
      let hasChanges = false;

      // Recalculate based on category
      if (project.category === "hourly") {
        const actualHours = project.timeEntries.reduce((total, entry) => total + (entry.hours || 0), 0);
        const newTotalAmount = project.hourlyRate * actualHours;
        
        if (project.actualHours !== actualHours || project.totalAmount !== newTotalAmount) {
          project.actualHours = actualHours;
          project.totalAmount = newTotalAmount;
          hasChanges = true;
        }
      } else if (project.category === "milestone") {
        const newTotalAmount = project.milestones.reduce((total, milestone) => total + (milestone.amount || 0), 0);
        
        if (project.totalAmount !== newTotalAmount) {
          project.totalAmount = newTotalAmount;
          hasChanges = true;
        }
      } else if (project.category === "fixed") {
        if (project.totalAmount !== project.fixedAmount) {
          project.totalAmount = project.fixedAmount || 0;
          hasChanges = true;
        }
      }

      // Recalculate payments
      const paidAmount = project.payments.reduce((total, payment) => total + (payment.amount || 0), 0);
      const pendingAmount = project.totalAmount - paidAmount;

      if (project.paidAmount !== paidAmount || project.pendingAmount !== pendingAmount) {
        project.paidAmount = paidAmount;
        project.pendingAmount = pendingAmount;
        hasChanges = true;
      }

      if (hasChanges) {
        await project.save();
        fixedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Fixed calculations for ${fixedCount} projects`,
      totalProjects: projects.length,
      fixedProjects: fixedCount
    });
  } catch (error) {
    console.error("Fix calculations error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fixing project calculations", 
      error: error.message 
    });
  }
};

// Add this route to fix all existing projects
router.put("/projects/fix-all-calculations", fixAllProjectCalculations);








// All routes require authentication and admin role (except where specified)
router.use(protect);

/* ----------------------- USER MANAGEMENT ----------------------- */

// Get all users (admin sees all, teamlead sees employees)
router.get("/users-filtered", authorizeRoles("admin", "teamlead"), getAllUsersFiltered);

// Get all users (admin only)
router.get("/users", authorizeRoles("admin"), getAllUsers);

// Create new user (admin only)
router.post("/users", authorizeRoles("admin"), createUser);

// Update user (admin only)
router.put("/users/:id", authorizeRoles("admin"), updateUser);

// Delete user (admin only)
router.delete("/users/:id", authorizeRoles("admin"), deleteUser);

// Promote user to team lead (admin only)
router.patch("/users/:id/promote", authorizeRoles("admin"), promoteUser);

/* ----------------------- EMPLOYEE MANAGEMENT ----------------------- */

// Get all employees (teamlead/admin)
router.get("/employees", authorizeRoles("admin", "teamlead"), getEmployees);

// Assign team members (teamlead only)
router.post("/assign-team", authorizeRoles("teamlead"), assignTeam);
router.get("/admin/users", authorizeRoles("admin"), getUsersForReports);


export default router;
// Add after your existing routes
