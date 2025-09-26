import Asset from "../models/Asset.js";
import User from "../models/User.js";

// 🔹 Centralized error handling
const handleError = (res, err, message = "Server error") => {
  console.error("AssetController Error:", err);
  return res.status(500).json({ success: false, message, error: err.message });
};

// ✅ Create asset (Admin only)
export const createAsset = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const newAsset = new Asset(req.body);
    await newAsset.save();
    return res.status(201).json({ success: true, data: newAsset });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Serial number already exists" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    return handleError(res, err, "Error creating asset");
  }
};

// ✅ Get ALL assets (Admin only)
export const getAssets = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    const assets = await Asset.find().populate("assignedTo", "name email role");
    return res.status(200).json({ success: true, data: assets });
  } catch (err) {
    return handleError(res, err, "Error fetching assets");
  }
};

// ✅ Get available (unassigned) assets
export const getAvailableAssets = async (req, res) => {
  try {
    const availableAssets = await Asset.find({ assignmentStatus: "unassigned" });
    return res.status(200).json({ success: true, data: availableAssets });
  } catch (err) {
    return handleError(res, err, "Error fetching available assets");
  }
};

// ✅ Get assigned assets with user info
export const getAssignedAssets = async (req, res) => {
  try {
    const assignedAssets = await Asset.find({ assignmentStatus: "assigned" })
      .populate("assignedTo", "name email role");
    return res.status(200).json({ success: true, data: assignedAssets });
  } catch (err) {
    return handleError(res, err, "Error fetching assigned assets");
  }
};

// ✅ Get asset by ID
export const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.assetId).populate("assignedTo", "name email role");
    if (!asset) return res.status(404).json({ success: false, message: "Asset not found" });
    return res.status(200).json({ success: true, data: asset });
  } catch (err) {
    return handleError(res, err, "Error fetching asset");
  }
};

// ✅ Assign asset to user (Admin only)
export const assignAsset = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { assetId, userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ success: false, message: "Asset not found" });

    if (asset.assignmentStatus === "assigned") {
      return res.status(400).json({ success: false, message: "Asset is already assigned" });
    }

    asset.assignedTo = userId;
    asset.assignmentStatus = "assigned";
    asset.assignmentDate = new Date();
    await asset.save();

    return res.status(200).json({ success: true, message: "Asset assigned successfully", data: asset });
  } catch (err) {
    return handleError(res, err, "Error assigning asset");
  }
};

// ✅ Return asset (Employee/Teamlead or Admin)
export const returnAsset = async (req, res) => {
  try {
    const { assetId } = req.params;
    const asset = await Asset.findById(assetId);

    if (!asset) return res.status(404).json({ success: false, message: "Asset not found" });

    if (String(asset.assignedTo) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You cannot return this asset" });
    }

    asset.assignedTo = null;
    asset.assignmentStatus = "unassigned";
    asset.returnDate = new Date();
    await asset.save();

    return res.status(200).json({ success: true, message: "Asset returned successfully", data: asset });
  } catch (err) {
    return handleError(res, err, "Error returning asset");
  }
};

// ✅ Update asset (Admin only)
export const updateAsset = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const updatedAsset = await Asset.findByIdAndUpdate(req.params.assetId, req.body, { new: true, runValidators: true });
    if (!updatedAsset) return res.status(404).json({ success: false, message: "Asset not found" });

    return res.status(200).json({ success: true, data: updatedAsset });
  } catch (err) {
    return handleError(res, err, "Error updating asset");
  }
};

// ✅ Delete asset (Admin only)
export const deleteAsset = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const deletedAsset = await Asset.findByIdAndDelete(req.params.assetId);
    if (!deletedAsset) return res.status(404).json({ success: false, message: "Asset not found" });

    return res.status(200).json({ success: true, message: "Asset deleted successfully" });
  } catch (err) {
    return handleError(res, err, "Error deleting asset");
  }
};

// ✅ Get assets assigned to logged-in user
export const getMyAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ assignedTo: req.user._id });
    return res.status(200).json({ success: true, data: assets });
  } catch (err) {
    return handleError(res, err, "Error fetching your assets");
  }
};

/* 
 🔹 EXTRA FEATURES (added but not replacing anything)
*/

// ✅ Get asset history (who used it before)
export const getAssetHistory = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.assetId).populate("history.user", "name email role");
    if (!asset) return res.status(404).json({ success: false, message: "Asset not found" });
    return res.status(200).json({ success: true, history: asset.history || [] });
  } catch (err) {
    return handleError(res, err, "Error fetching asset history");
  }
};

// ✅ Search assets by keyword (serial number, name, type)
export const searchAssets = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: "Search query required" });

    const regex = new RegExp(q, "i");
    const assets = await Asset.find({
      $or: [{ name: regex }, { serialNumber: regex }, { type: regex }],
    });

    return res.status(200).json({ success: true, data: assets });
  } catch (err) {
    return handleError(res, err, "Error searching assets");
  }
};

// ✅ Get all returned assets (Admin only) - for return tracking dashboard
export const getReturnedAssets = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const returnedAssets = await Asset.find({ 
      assignmentStatus: "unassigned", 
      returnDate: { $exists: true } 
    }).populate("assignedTo", "name email role").sort({ returnDate: -1 });

    return res.status(200).json({ 
      success: true, 
      data: returnedAssets,
      count: returnedAssets.length 
    });
  } catch (err) {
    return handleError(res, err, "Error fetching returned assets");
  }
};

// ✅ Get asset return statistics (Admin only)
export const getAssetReturnStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const totalAssets = await Asset.countDocuments();
    const assignedAssets = await Asset.countDocuments({ assignmentStatus: "assigned" });
    const unassignedAssets = await Asset.countDocuments({ assignmentStatus: "unassigned" });
    const returnedAssets = await Asset.countDocuments({ 
      assignmentStatus: "unassigned", 
      returnDate: { $exists: true } 
    });

    // Recent returns (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentReturns = await Asset.countDocuments({
      returnDate: { $gte: thirtyDaysAgo }
    });

    return res.status(200).json({
      success: true,
      stats: {
        total: totalAssets,
        assigned: assignedAssets,
        unassigned: unassignedAssets,
        returned: returnedAssets,
        recentReturns: recentReturns
      }
    });
  } catch (err) {
    return handleError(res, err, "Error fetching asset return statistics");
  }
};

// ✅ Get overdue assets (assigned for too long) - Admin only
export const getOverdueAssets = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { days = 90 } = req.query; // Default 90 days, can be customized
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - parseInt(days));

    const overdueAssets = await Asset.find({
      assignmentStatus: "assigned",
      assignmentDate: { $lte: overdueDate }
    }).populate("assignedTo", "name email role").sort({ assignmentDate: 1 });

    return res.status(200).json({
      success: true,
      data: overdueAssets,
      count: overdueAssets.length,
      overdueThreshold: `${days} days`
    });
  } catch (err) {
    return handleError(res, err, "Error fetching overdue assets");
  }
};

// ✅ Force return asset (Admin only) - for when employee doesn't return
export const forceReturnAsset = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { assetId } = req.params;
    const { reason = "Admin force return" } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ success: false, message: "Asset not found" });

    if (asset.assignmentStatus !== "assigned") {
      return res.status(400).json({ success: false, message: "Asset is not currently assigned" });
    }

    // Store previous assignment info before clearing
    const previousAssignee = asset.assignedTo;
    
    asset.assignedTo = null;
    asset.assignmentStatus = "unassigned";
    asset.returnDate = new Date();
    asset.returnReason = reason;
    asset.returnType = "forced"; // Track that this was a forced return
    
    await asset.save();

    return res.status(200).json({ 
      success: true, 
      message: "Asset force returned successfully", 
      data: asset,
      previousAssignee 
    });
  } catch (err) {
    return handleError(res, err, "Error force returning asset");
  }
};

// ✅ Get return report (detailed return information) - Admin only  
export const getReturnReport = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { startDate, endDate, status } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.returnDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let statusFilter = {};
    if (status) {
      statusFilter.assignmentStatus = status;
    }

    const filter = { ...dateFilter, ...statusFilter };
    
    const assets = await Asset.find(filter)
      .populate("assignedTo", "name email role")
      .sort({ returnDate: -1 });

    // Group by return type if available
    const returnStats = {
      total: assets.length,
      voluntary: assets.filter(a => a.returnType !== "forced").length,
      forced: assets.filter(a => a.returnType === "forced").length
    };

    return res.status(200).json({
      success: true,
      data: assets,
      stats: returnStats,
      filters: { startDate, endDate, status }
    });
  } catch (err) {
    return handleError(res, err, "Error generating return report");
  }
};