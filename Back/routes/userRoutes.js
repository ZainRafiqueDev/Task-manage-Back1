// routes/userRoutes.js
import express from "express";
import { protect, authorizeRoles , requireTeamLead ,validateProjectOwnership} from "../middleware/authMiddleware.js";
import {
  // User Management
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  promoteUser,
  getAllUsersFiltered,

  // Employee Management
  getEmployees,
  getAvailableEmployees,

  // Team Management
  getMyTeam,
  assignTeam,
  removeFromTeam,

  // Task Management
  assignTask,
  getMyAssignedTasks,
  updateTaskStatus,
  getTasks,
  deleteTask,
  getEmployeeTasks,
  fetchEmployeesData,

  // Project Management
  getProjects,
  getProjectsForTasks,
 
  getEmployeeWorkloadSummary
} from "../controllers/userController.js";
import{
     assignEmployeesToProject,

}from "../controllers/ProjectController.js";
const router = express.Router();

// Protect all routes
router.use(protect);

// ==========================
// User Management Routes (Admin only)
// ==========================
router.get("/", authorizeRoles("admin"), getAllUsers);
router.post("/", authorizeRoles("admin"), createUser);
router.put("/:id", authorizeRoles("admin"), updateUser);
router.delete("/:id", authorizeRoles("admin"), deleteUser);
router.patch("/:id/promote", authorizeRoles("admin"), promoteUser);
router.get("/filtered", authorizeRoles("admin", "teamlead"), getAllUsersFiltered);
router.get('/employees', protect, getAvailableEmployees);
router.get('/employees/workload', protect, getEmployeeWorkloadSummary);
 router.put('/:projectId/assign-employees', protect, requireTeamLead, validateProjectOwnership, assignEmployeesToProject);

// ==========================
// Employee Management Routes (Admin + TeamLead)
// ==========================
router.get("/employees", authorizeRoles("admin", "teamlead"), getEmployees);
router.get("/employees/available", authorizeRoles("admin", "teamlead"), getAvailableEmployees);

// Special Teamlead-only employees view
router.get("/employees/teamlead-view", authorizeRoles("teamlead"), fetchEmployeesData);

// Employee-specific tasks
router.get("/employees/:employeeId/tasks", authorizeRoles("teamlead"), getEmployeeTasks);

// ==========================
// Team Management Routes (TeamLead only)
// ==========================
router.get("/team/my-team", authorizeRoles("teamlead"), getMyTeam);
router.post("/assign-team", authorizeRoles("teamlead"), assignTeam);
router.post("/remove-team", authorizeRoles("teamlead"), removeFromTeam);

// ==========================
// Task Management Routes (Admin + TeamLead)
// ==========================
router.post("/tasks/assign", authorizeRoles("teamlead", "admin"), assignTask);
router.get("/tasks/my-assigned", authorizeRoles("teamlead"), getMyAssignedTasks);
router.patch("/tasks/:taskId/status", authorizeRoles("teamlead", "admin"), updateTaskStatus);
router.get("/tasks", authorizeRoles("teamlead", "admin"), getTasks);
router.delete("/tasks/:taskId", authorizeRoles("teamlead", "admin"), deleteTask);

// ==========================
// Project Management Routes (Admin + TeamLead)
// ==========================
router.get("/projects", authorizeRoles("teamlead", "admin"), getProjects);
router.get("/projects/for-tasks", authorizeRoles("teamlead"), getProjectsForTasks);

export default router;
