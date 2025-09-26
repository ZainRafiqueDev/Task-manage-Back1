// controllers/reportController.js
import Report from "../models/Report.js";
import User from "../models/User.js";

/**
 * @desc Get all users except admin (for report assignment)
 * @route GET /api/reports/users
 * @access TeamLead / Admin
 */
export const getUsersForReports = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .select("name email role isActive")
      .sort({ role: 1, name: 1 });

    res.status(200).json({ 
      success: true, 
      count: users.length, 
      users 
    });
  } catch (err) {
    console.error("GetUsersForReports Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching users", 
      error: err.message 
    });
  }
};

/**
 * @desc Get all reports (Admin View)
 * @route GET /api/reports/admin
 * @access Admin
 */
export const getReportsForAdmin = async (req, res) => {
  try {
    const { type, status, completionStatus, from, to, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (completionStatus) filter.completionStatus = completionStatus;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const reports = await Report.find(filter)
      .populate("createdBy", "name email role")
      .populate("forUser", "name email role")
      .populate("feedbacks.givenBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.json({ 
      success: true, 
      count: reports.length, 
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      reports 
    });
  } catch (err) {
    console.error("GetReportsForAdmin Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * @desc Create a new report
 * @route POST /api/reports
 * @access Employee, TeamLead, Admin
 */
export const createReport = async (req, res) => {
  try {
    const { type, forUser, content, tasksCompleted, tasksPending, projectStats } = req.body;

    if (!content || !type) {
      return res.status(400).json({ 
        success: false, 
        message: "Type and content are required" 
      });
    }

    // Validation for report types
    if (!["daily", "monthly"].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid report type. Must be 'daily' or 'monthly'" 
      });
    }

    // Role-based logic
    let targetUser = req.user._id;
    
    if (req.user.role === "admin" || req.user.role === "teamlead") {
      // Admin/TeamLead can create reports for others
      if (forUser) {
        const user = await User.findById(forUser);
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: "Target user not found" 
          });
        }
        targetUser = forUser;
      }
    }

    // Validate project stats structure
    const defaultProjectStats = { done: 0, inProgress: 0, selected: 0 };
    const validatedProjectStats = projectStats ? {
      done: Math.max(0, parseInt(projectStats.done) || 0),
      inProgress: Math.max(0, parseInt(projectStats.inProgress) || 0),
      selected: Math.max(0, parseInt(projectStats.selected) || 0)
    } : defaultProjectStats;

    const report = await Report.create({
      type,
      createdBy: req.user._id,
      forUser: targetUser,
      content: content.trim(),
      tasksCompleted: Math.max(0, parseInt(tasksCompleted) || 0),
      tasksPending: Math.max(0, parseInt(tasksPending) || 0),
      projectStats: validatedProjectStats,
    });

    // Populate the created report
    const populatedReport = await Report.findById(report._id)
      .populate("createdBy", "name email role")
      .populate("forUser", "name email role");

    res.status(201).json({
      success: true,
      message: "Report created successfully",
      report: populatedReport,
    });
  } catch (err) {
    console.error("CreateReport Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create report",
      error: err.message,
    });
  }
};

/**
 * @desc Get reports created by logged-in user
 * @route GET /api/reports/my
 * @access Logged-in user
 */
export const getMyReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;
    const filter = { createdBy: req.user._id };
    
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const reports = await Report.find(filter)
      .populate("forUser", "name email role")
      .populate("feedbacks.givenBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.status(200).json({ 
      success: true, 
      count: reports.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      reports 
    });
  } catch (err) {
    console.error("GetMyReports Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching reports", 
      error: err.message 
    });
  }
};

/**
 * @desc Get reports for a specific user (TeamLead reviewing employees)
 * @route GET /api/reports/user/:userId
 * @access TeamLead/Admin
 */
export const getReportsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, type, status } = req.query;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const filter = { forUser: userId };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const reports = await Report.find(filter)
      .populate("createdBy", "name email role")
      .populate("forUser", "name email role")
      .populate("feedbacks.givenBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.status(200).json({ 
      success: true, 
      count: reports.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      user: { name: user.name, email: user.email, role: user.role },
      reports 
    });
  } catch (err) {
    console.error("GetReportsForUser Error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

/**
 * @desc Update a report (only creator or admin)
 * @route PUT /api/reports/:reportId
 * @access Creator / Admin
 */
export const updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { content, tasksCompleted, tasksPending, projectStats } = req.body;

    let report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: "Report not found" 
      });
    }

    // Authorization check
    if (report.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to update this report" 
      });
    }

    // Prepare update data
    const updateData = {};
    if (content !== undefined) updateData.content = content.trim();
    if (tasksCompleted !== undefined) updateData.tasksCompleted = Math.max(0, parseInt(tasksCompleted) || 0);
    if (tasksPending !== undefined) updateData.tasksPending = Math.max(0, parseInt(tasksPending) || 0);
    
    if (projectStats) {
      updateData.projectStats = {
        done: Math.max(0, parseInt(projectStats.done) || 0),
        inProgress: Math.max(0, parseInt(projectStats.inProgress) || 0),
        selected: Math.max(0, parseInt(projectStats.selected) || 0)
      };
    }

    report = await Report.findByIdAndUpdate(reportId, updateData, {
      new: true,
      runValidators: true,
    })
    .populate("createdBy", "name email role")
    .populate("forUser", "name email role")
    .populate("feedbacks.givenBy", "name email role");

    res.status(200).json({ 
      success: true, 
      message: "Report updated successfully", 
      report 
    });
  } catch (err) {
    console.error("UpdateReport Error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

/**
 * @desc Delete a report (only creator or admin)
 * @route DELETE /api/reports/:reportId
 * @access Creator / Admin
 */
export const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: "Report not found" 
      });
    }

    // Authorization check
    if (report.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to delete this report" 
      });
    }

    await Report.findByIdAndDelete(reportId);

    res.status(200).json({ 
      success: true, 
      message: "Report deleted successfully" 
    });
  } catch (err) {
    console.error("DeleteReport Error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

/**
 * @desc Add feedback to a report (TeamLead/Admin)
 * @route POST /api/reports/:reportId/feedback
 * @access TeamLead / Admin
 */
export const addFeedback = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { comment, rating } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Comment is required" 
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ 
        success: false, 
        message: "Rating must be between 1 and 5" 
      });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: "Report not found" 
      });
    }

    const feedbackData = {
      givenBy: req.user._id,
      role: req.user.role,
      comment: comment.trim(),
    };

    if (rating) {
      feedbackData.rating = parseInt(rating);
    }

    report.feedbacks.push(feedbackData);

    // Update report status
    if (report.status !== "approved") {
      report.status = "reviewed";
    }

    await report.save();

    // Populate and return updated report
    const updatedReport = await Report.findById(reportId)
      .populate("createdBy", "name email role")
      .populate("forUser", "name email role")
      .populate("feedbacks.givenBy", "name email role");

    res.status(200).json({ 
      success: true, 
      message: "Feedback added successfully", 
      report: updatedReport 
    });
  } catch (err) {
    console.error("AddFeedback Error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

/**
 * @desc Mark a report as complete/incomplete (TeamLead/Admin)
 * @route PATCH /api/reports/:reportId/completion
 * @access TeamLead / Admin
 */
export const updateCompletionStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { completionStatus } = req.body;

    if (!["complete", "incomplete", "pending"].includes(completionStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid completion status. Must be 'complete', 'incomplete', or 'pending'" 
      });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: "Report not found" 
      });
    }

    report.completionStatus = completionStatus;
    
    // Auto-approve if marked complete
    if (completionStatus === "complete") {
      report.status = "approved";
    }

    await report.save();

    const updatedReport = await Report.findById(reportId)
      .populate("createdBy", "name email role")
      .populate("forUser", "name email role")
      .populate("feedbacks.givenBy", "name email role");

    res.status(200).json({ 
      success: true, 
      message: `Report marked as ${completionStatus}`, 
      report: updatedReport 
    });
  } catch (err) {
    console.error("UpdateCompletionStatus Error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

/**
 * @desc Review a report (TeamLead/Admin)
 * @route PATCH /api/reports/:reportId/review
 * @access TeamLead / Admin
 */
export const reviewReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: "Report not found" 
      });
    }

    // Mark as reviewed if not already approved
    if (report.status !== "approved") {
      report.status = "reviewed";
    }

    await report.save();

    const updatedReport = await Report.findById(reportId)
      .populate("createdBy", "name email role")
      .populate("forUser", "name email role")
      .populate("feedbacks.givenBy", "name email role");

    res.status(200).json({
      success: true,
      message: "Report marked as reviewed",
      report: updatedReport,
    });
  } catch (err) {
    console.error("ReviewReport Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error reviewing report", 
      error: err.message 
    });
  }
};

/**
 * @desc Submit a report to the next level
 * @route POST /api/reports/:reportId/submit
 * @access Employee / TeamLead / Admin
 */
export const submitReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { forwardToIds } = req.body;

    if (!Array.isArray(forwardToIds) || forwardToIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one recipient is required"
      });
    }

    const report = await Report.findById(reportId).populate("createdBy");
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    // Authorization check
    const userId = req.user._id.toString();
    const isCreator = report.createdBy._id.toString() === userId;
    const isAdmin = req.user.role === "admin";
    const isTeamlead = req.user.role === "teamlead";

    // Allow: 
    //  - creator themselves
    //  - admin
    //  - teamlead submitting an employee’s report
    if (
      !isCreator &&
      !isAdmin &&
      !(
        isTeamlead &&
        report.createdBy.role === "employee"
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to submit this report"
      });
    }

    // Role-based submission rules
    let allowedRoles;
    switch (req.user.role) {
      case "employee":
        allowedRoles = ["teamlead"];
        break;
      case "teamlead":
        // teamlead can forward own reports to admin
        // and also forward employee reports to admin
        allowedRoles = ["admin"];
        break;
      case "admin":
        allowedRoles = ["teamlead", "employee"];
        break;
      default:
        return res.status(403).json({
          success: false,
          message: "Not authorized to submit reports"
        });
    }

    // Validate recipients
    const invalidRecipients = await User.find({
      _id: { $in: forwardToIds },
      role: { $nin: allowedRoles }
    });

    if (invalidRecipients.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid recipients for your role. Allowed roles: ${allowedRoles.join(", ")}`
      });
    }

    // Update report status
    report.forwardedTo = forwardToIds;
    report.status = "submitted";
    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report submitted successfully",
      report
    });

  } catch (error) {
    console.error("Submit Report Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while submitting report"
    });
  }
};

/**
 * @desc Submit a daily report (Employee)
 * @route POST /api/reports/daily/submit
 * @access Employee
 */
export const submitDailyReport = async (req, res) => {
  try {
    const { content, tasksCompleted, tasksPending, projectStats } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Content is required" 
      });
    }

    // Check if user already submitted a daily report today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const existingReport = await Report.findOne({
      createdBy: req.user._id,
      type: "daily",
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a daily report today"
      });
    }

    const defaultProjectStats = { done: 0, inProgress: 0, selected: 0 };
    const validatedProjectStats = projectStats ? {
      done: Math.max(0, parseInt(projectStats.done) || 0),
      inProgress: Math.max(0, parseInt(projectStats.inProgress) || 0),
      selected: Math.max(0, parseInt(projectStats.selected) || 0)
    } : defaultProjectStats;

    const report = await Report.create({
      type: "daily",
      createdBy: req.user._id,
      forUser: req.user._id,
      content: content.trim(),
      tasksCompleted: Math.max(0, parseInt(tasksCompleted) || 0),
      tasksPending: Math.max(0, parseInt(tasksPending) || 0),
      projectStats: validatedProjectStats,
      status: "submitted",
    });

    const populatedReport = await Report.findById(report._id)
      .populate("createdBy", "name email role")
      .populate("forUser", "name email role");

    res.status(201).json({ 
      success: true, 
      message: "Daily report submitted successfully", 
      report: populatedReport 
    });
  } catch (err) {
    console.error("SubmitDailyReport Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error submitting daily report", 
      error: err.message 
    });
  }
};
// Add this to your reportController.js

export const submitToHierarchy = async (req, res) => {
  try {
    const { reportId } = req.params;
    const currentUser = req.user;

    const report = await Report.findById(reportId).populate("createdBy");
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    // Authorization check - only report creator or authorized roles can submit
    const userId = currentUser._id.toString();
    const isCreator = report.createdBy._id.toString() === userId;
    const isTeamlead = currentUser.role === "teamlead";
    const isAdmin = currentUser.role === "admin";

    if (!isCreator && !isTeamlead && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to submit this report"
      });
    }

    // Determine target role based on current user's role
    let targetRole;
    if (currentUser.role === "employee") {
      targetRole = "teamlead";
    } else if (currentUser.role === "teamlead") {
      targetRole = "admin";
    } else {
      return res.status(400).json({
        success: false,
        message: "Admin users cannot submit reports up the hierarchy"
      });
    }

    // Find users with the target role
    const recipients = await User.find({ 
      role: targetRole,
      isActive: { $ne: false } // Exclude deactivated users if you have this field
    }).select("_id name email role");

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No active ${targetRole} found to submit to. Please contact your administrator.`
      });
    }

    // Update report
    const forwardToIds = recipients.map(r => r._id);
    report.forwardedTo = forwardToIds;
    report.status = "submitted";
    report.submittedAt = new Date();
    
    // Add submission history
    if (!report.submissionHistory) {
      report.submissionHistory = [];
    }
    report.submissionHistory.push({
      submittedBy: currentUser._id,
      submittedTo: forwardToIds,
      submittedAt: new Date(),
      fromRole: currentUser.role,
      toRole: targetRole
    });

    await report.save();

    return res.status(200).json({
      success: true,
      message: `Report submitted to ${recipients.map(r => r.name).join(", ")} successfully`,
      report: {
        _id: report._id,
        status: report.status,
        submittedTo: recipients.map(r => ({ _id: r._id, name: r.name, role: r.role }))
      }
    });

  } catch (error) {
    console.error("Submit to Hierarchy Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while submitting report"
    });
  }
};