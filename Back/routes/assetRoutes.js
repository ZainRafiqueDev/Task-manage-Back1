import express from "express";
import {
  createAsset,
  getAssets,
  getAvailableAssets,
  getAssignedAssets,
  getAssetById,
  assignAsset,
  returnAsset,
  updateAsset,
  deleteAsset,
  getMyAssets,
  getAssetHistory,
  searchAssets,
  // New return-related functions (add these to your controller imports)
  getReturnedAssets,
  getAssetReturnStats,
  getOverdueAssets,
  forceReturnAsset,
  getReturnReport
} from "../controllers/assetController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// ----------------- Admin Routes -----------------
router
  .route("/")
  .post(protect, authorizeRoles("admin"), createAsset) // Create asset
  .get(protect, authorizeRoles("admin"), getAssets);  // Get all assets

// Asset status routes (Admin only)
router.get("/available", protect, authorizeRoles("admin"), getAvailableAssets);
router.get("/assigned", protect, authorizeRoles("admin"), getAssignedAssets);
router.get("/returned", protect, authorizeRoles("admin"), getReturnedAssets);
router.get("/overdue", protect, authorizeRoles("admin"), getOverdueAssets);

// Asset statistics and reports (Admin only)
router.get("/stats", protect, authorizeRoles("admin"), getAssetReturnStats);
router.get("/return-report", protect, authorizeRoles("admin"), getReturnReport);

// Search functionality (all authenticated users)
router.get("/search", protect, searchAssets);

// Assign asset (Admin only)
router.post("/assign", protect, authorizeRoles("admin"), assignAsset);

// Force return asset (Admin only)
router.put("/force-return/:assetId", protect, authorizeRoles("admin"), forceReturnAsset);

// ----------------- Individual Asset Routes -----------------
router
  .route("/:assetId")
  .put(protect, authorizeRoles("admin"), updateAsset)  // Update asset
  .delete(protect, authorizeRoles("admin"), deleteAsset) // Delete asset
  .get(protect, getAssetById); // Get asset by ID (all roles)

// Asset history (all authenticated users can view)
router.get("/:assetId/history", protect, getAssetHistory);

// ----------------- Employee/Teamlead Routes -----------------
// Get user's own assets
router.get("/my/assets", protect, authorizeRoles("teamlead", "employee"), getMyAssets);

// Return asset (Employee, Teamlead, or Admin can return)
router.put(
  "/return/:assetId",
  protect,
  authorizeRoles("teamlead", "employee", "admin"),
  returnAsset
);

export default router;