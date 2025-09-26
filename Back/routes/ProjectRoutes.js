// routes/projectRoutes.js
import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  addProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectDetails,
  getProjectDetails,
  updateProjectDetails,
  deleteProjectDetails,
  addProjectGroup,
  getAllProjectGroups,
  updateProjectGroup,
  deleteProjectGroup,
  addPayment,
  updatePayment,
  deletePayment,
  addMilestonePayment,
  addTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  updateClientStatus,
  assignTeamLead,
  assignEmployees,
  recalculateProject,
  getAvailableProjects,
  getMyProjects,
  getAssignedProjects,
  pickProject,
  releaseProject,
  getProjectsWithTasks,
  getTeamWithTasks,
  getDashboardStats,
  getEmployeesWithTaskStatus,
  getTaskAssignmentOverview,
  getEmployeeTasks,
  getEmployeeTaskById,
  updateEmployeeTaskStatus,
  addEmployeeTaskResponse,
  getEmployeeProjectDetails,
  assignEmployeesToProject,
  removeEmployeeFromProject,
  getProjectAssignmentHistory,
  getTeamLeadProjectsEnhanced
} from "../controllers/ProjectController.js";

const router = express.Router();

// Protect all routes
router.use(protect);

// ========================================
// TEAMLEAD DASHBOARD ROUTES (SPECIFIC ROUTES FIRST)
// ========================================
router.get("/teamlead/overview", authorizeRoles("teamlead"), getProjectsWithTasks);
router.get("/teamlead/team", authorizeRoles("teamlead"), getTeamWithTasks);
router.get("/teamlead/stats", authorizeRoles("teamlead"), getDashboardStats);
router.get("/teamlead/employees", authorizeRoles("teamlead"), getEmployeesWithTaskStatus);
router.get("/teamlead/tasks", authorizeRoles("teamlead"), getTaskAssignmentOverview);
router.get('/mine', protect, getTeamLeadProjectsEnhanced); // Enhanced version of existing route
router.put('/:projectId/assign-employees', protect, assignEmployeesToProject);
router.delete('/:projectId/employees/:employeeId', protect, removeEmployeeFromProject);
router.get('/:projectId/assignment-history', protect, getProjectAssignmentHistory);


// ========================================
// PROJECT GROUPS ROUTES (SPECIFIC ROUTES FIRST)
// ========================================
router.post("/groups", authorizeRoles("admin"), addProjectGroup);
router.get("/groups", authorizeRoles("admin", "teamlead"), getAllProjectGroups);
router.put("/groups/:groupId", authorizeRoles("admin"), updateProjectGroup);
router.delete("/groups/:groupId", authorizeRoles("admin"), deleteProjectGroup);

// ========================================
// ROLE-SPECIFIC PROJECT ACCESS ROUTES
// ========================================
router.get("/available", authorizeRoles("teamlead"), getAvailableProjects);
router.get("/mine", authorizeRoles("teamlead", "employee"), getMyProjects);
router.get("/assigned", authorizeRoles("employee"), getAssignedProjects);

// ========================================
// PROJECT ACTIONS (TEAMLEAD SPECIFIC)
// ========================================
router.put("/:id/pick", authorizeRoles("teamlead"), pickProject);
router.put("/:id/release", authorizeRoles("teamlead"), releaseProject);

// ========================================
// PROJECT DETAILS ROUTES (SPECIFIC ROUTES)
// ========================================
router.post("/:projectId/details", authorizeRoles("admin"), addProjectDetails);
router.get("/:projectId/details", authorizeRoles("admin", "teamlead"), getProjectDetails);
router.put("/details/:detailId", authorizeRoles("admin"), updateProjectDetails);
router.delete("/details/:detailId", authorizeRoles("admin"), deleteProjectDetails);

// ========================================
// PROJECT MANAGEMENT ROUTES
// ========================================
router.put("/:projectId/teamlead", authorizeRoles("admin"), assignTeamLead);
router.put("/:projectId/employees", authorizeRoles("admin"), assignEmployees);
router.patch("/:projectId/client-status", authorizeRoles("admin", "teamlead"), updateClientStatus);
router.put("/:projectId/recalculate", authorizeRoles("admin"), recalculateProject);

// ========================================
// MILESTONE ROUTES
// ========================================
router.post("/:projectId/milestones", authorizeRoles("admin"), addMilestone);
router.put("/:projectId/milestones/:milestoneId", authorizeRoles("admin"), updateMilestone);
router.delete("/:projectId/milestones/:milestoneId", authorizeRoles("admin"), deleteMilestone);



router.get("/employee/tasks", authorizeRoles("employee"), getEmployeeTasks);
router.get("/employee/tasks/:taskId", authorizeRoles("employee"), getEmployeeTaskById);
router.patch("/employee/tasks/:taskId/status", authorizeRoles("employee"), updateEmployeeTaskStatus);
router.post("/employee/tasks/:taskId/response", authorizeRoles("employee"), addEmployeeTaskResponse);


// ========================================
// PAYMENT ROUTES
// ========================================
router.post("/:projectId/payments", authorizeRoles("admin"), addPayment);
router.put("/:projectId/payments/:paymentId", authorizeRoles("admin"), updatePayment);
router.delete("/:projectId/payments/:paymentId", authorizeRoles("admin"), deletePayment);
router.post("/:projectId/milestones/:milestoneId/payments", authorizeRoles("admin"), addMilestonePayment);

// ========================================
// TIME ENTRY ROUTES (ADMIN + TEAMLEAD ACCESS)
// ========================================
router.post("/:projectId/time-entries", authorizeRoles("admin", "teamlead"), addTimeEntry);
router.put("/:projectId/time-entries/:timeEntryId", authorizeRoles("admin", "teamlead"), updateTimeEntry);
router.delete("/:projectId/time-entries/:timeEntryId", authorizeRoles("admin", "teamlead"), deleteTimeEntry);
router.get("/employee/project/:projectId", authorizeRoles("employee"), getEmployeeProjectDetails);
// ========================================
// BASIC PROJECT CRUD (GENERIC ROUTES LAST)
// ========================================
router.post("/", authorizeRoles("admin"), addProject);
router.get("/", authorizeRoles("admin", "teamlead"), getAllProjects);
router.get("/:id", authorizeRoles("admin", "teamlead"), getProjectById);
router.put("/:id", authorizeRoles("admin"), updateProject);
router.delete("/:id", authorizeRoles("admin"), deleteProject);

export default router;