// routes/reportRoutes.js
import express from "express";
import {
  getReportsForAdmin,
  getMyReports,
  createReport,
  addFeedback,
  updateCompletionStatus,
  getReportsForUser,
  updateReport,
  deleteReport,
  reviewReport,
  submitReport,
  submitDailyReport,
  getUsersForReports,
  submitToHierarchy
} from "../controllers/reportController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();


router.use(protect);


router.get("/users", authorizeRoles("teamlead", "admin"), getUsersForReports); // Get users for report assignment


router.get("/me", getMyReports);                 // Logged-in user's reports
// Create daily/monthly report (Employee, TeamLead, Admin)
router.post("/", authorizeRoles("employee", "teamlead", "admin"), createReport);
              // Create daily/monthly report
router.put("/:reportId", updateReport);          // Update your own report
router.delete("/:reportId", deleteReport);       // Delete your own report


router.post("/daily/submit", authorizeRoles("employee"), submitDailyReport); // Submit daily report


router.get(
  "/user/:userId",
  authorizeRoles("teamlead", "admin"),
  getReportsForUser
); // View reports of a specific user

router.post(
  "/:reportId/feedback",
  authorizeRoles("teamlead", "admin"),
  addFeedback
); // Add feedback to report

router.patch(
  "/:reportId/completion",
  authorizeRoles("teamlead", "admin"),
  updateCompletionStatus
); // Mark report complete/incomplete

router.patch(
  "/:reportId/review",
  authorizeRoles("teamlead", "admin"),
  reviewReport
); // Mark report as reviewed

router.post(
  "/:reportId/submit",
  authorizeRoles("employee", "teamlead", "admin"),
  submitReport
); // Submit report to next level

// Add this route after your existing routes
router.post(
  "/:reportId/submit-to-hierarchy",
  authorizeRoles("employee", "teamlead"),
  submitToHierarchy
); // Submit report up the hierarchy chain

router.get("/admin", authorizeRoles("admin"), getReportsForAdmin); // Get all reports (with filters)

export default router;