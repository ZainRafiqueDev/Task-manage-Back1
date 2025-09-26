// routes/taskRoutes.js
import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  addEmployeeResponse,
  addLog,
} from "../controllers/TaskController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================
// Protect all routes
// ==========================
router.use(protect);

// ==========================
// Task Management (Admin + Teamlead)
// ==========================
router.post("/", authorizeRoles("admin", "teamlead"), createTask);       // Create a new task
router.put("/:taskId", authorizeRoles("admin", "teamlead"), updateTask); // Update task details
router.delete("/:taskId", authorizeRoles("admin", "teamlead"), deleteTask); // Delete a task

// ==========================
// Shared routes (role-based filtering in controller)
// ==========================
router.get("/", getTasks);           // Get all tasks (admin sees all, teamlead filtered, employee filtered)
router.get("/:taskId", getTaskById); // Get single task (role-restricted in controller)

// ==========================
// Employee & Teamlead actions
// ==========================
router.post(
  "/:taskId/response",
  authorizeRoles("employee", "teamlead"),
  addEmployeeResponse
); // Add response/progress

router.post(
  "/:taskId/log",
  authorizeRoles("employee", "teamlead"),
  addLog
); // Add time log

export default router;
