// controllers/employeeDashboardController.js
import { Project } from "../models/Project.js";
import Task from "../models/Task.js";
import Report from "../models/Report.js";
import User from "../models/User.js";
import Asset from "../models/Asset.js";
import Notification from "../models/Notification.js";

// Helper function for error handling
const handleError = (res, err, message = "Server error") => {
  console.error("EmployeeDashboard Error:", err);
  return res.status(500).json({ success: false, message, error: err.message });
};

/* ==================== PROJECTS TAB ==================== */

/**
 * @desc Get projects assigned to the logged-in employee
 * @route GET /api/employee/projects
 * @access Private (Employee only)
 */
export const getMyProjects = async (req, res) => {
  try {
    // Find projects where the employee is in the employees array
    const projects = await Project.find({
      employees: req.user._id,
      status: { $nin: ['cancelled', 'archived'] } // Exclude cancelled/archived
    })
      .populate("teamLead", "name email role")
      .populate("employees", "name email role")
      .populate({
        path: "tasks",
        match: { assignedTo: req.user._id }, // Only tasks assigned to this employee
        populate: {
          path: "createdBy assignedTo",
          select: "name email"
        }
      })
      .select("-payments -paidAmount -pendingAmount -totalAmount -fixedAmount -hourlyRate") // Hide financial data
      .sort({ updatedAt: -1 });

    // Calculate project statistics for employee
    const projectStats = projects.map(project => {
      const employeeTasks = project.tasks || [];
      const completedTasks = employeeTasks.filter(task => task.status === 'completed').length;
      const pendingTasks = employeeTasks.filter(task => task.status === 'pending').length;
      const inProgressTasks = employeeTasks.filter(task => task.status === 'in-progress').length;

      return {
        ...project.toObject(),
        employeeTaskStats: {
          total: employeeTasks.length,
          completed: completedTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completionRate: employeeTasks.length > 0 ? Math.round((completedTasks / employeeTasks.length) * 100) : 0
        }
      };
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects: projectStats
    });
  } catch (error) {
    return handleError(res, error, "Error fetching assigned projects");
  }
};

/**
 * @desc Get single project details for employee
 * @route GET /api/employee/projects/:projectId
 * @access Private (Employee only)
 */
export const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Find project and verify employee has access
    const project = await Project.findOne({
      _id: projectId,
      employees: req.user._id
    })
      .populate("teamLead", "name email role")
      .populate("employees", "name email role")
      .select("-payments -paidAmount -pendingAmount -totalAmount -fixedAmount -hourlyRate");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you don't have access to it"
      });
    }

    // Get tasks for this employee in this project
    const tasks = await Task.find({
      project: projectId,
      assignedTo: req.user._id
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      project,
      tasks
    });
  } catch (error) {
    return handleError(res, error, "Error fetching project details");
  }
};

/* ==================== TASKS TAB ==================== */

/**
 * @desc Get all tasks assigned to the logged-in employee
 * @route GET /api/employee/tasks
 * @access Private (Employee only)
 */
export const getMyTasks = async (req, res) => {
  try {
    const { status, priority, project, search } = req.query;
    
    // Build filter
    let filter = { assignedTo: req.user._id };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    
    if (project && project !== 'all') {
      filter.project = project;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(filter)
      .populate("project", "projectName clientName deadline status")
      .populate("createdBy", "name email role")
      .populate("logs.updatedBy", "name email")
      .populate("employeeResponses.createdBy", "name email")
      .sort({ dueDate: 1, createdAt: -1 });

    // Calculate task statistics
    const taskStats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length
    };

    res.status(200).json({
      success: true,
      count: tasks.length,
      stats: taskStats,
      tasks
    });
  } catch (error) {
    return handleError(res, error, "Error fetching tasks");
  }
};

/**
 * @desc Get single task details
 * @route GET /api/employee/tasks/:taskId
 * @access Private (Employee only)
 */
export const getTaskDetails = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({
      _id: taskId,
      assignedTo: req.user._id
    })
      .populate("project", "projectName clientName deadline")
      .populate("createdBy", "name email role")
      .populate("logs.updatedBy", "name email")
      .populate("employeeResponses.createdBy", "name email");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to you"
      });
    }

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    return handleError(res, error, "Error fetching task details");
  }
};

/**
 * @desc Log time on a task
 * @route POST /api/employee/tasks/:taskId/log-time
 * @access Private (Employee only)
 */
export const logTimeOnTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { update, startTime, endTime, description } = req.body;

    // Validation
    if (!update || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Update description, start time, and end time are required"
      });
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time"
      });
    }

    // Find task and verify employee has access
    const task = await Task.findOne({
      _id: taskId,
      assignedTo: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to you"
      });
    }

    // Use the model's addLog method
    await task.addLog({
      update: update.trim(),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      description: description?.trim() || "",
      updatedBy: req.user._id
    });

    // Update task status to in-progress if it's pending
    if (task.status === 'pending') {
      task.status = 'in-progress';
      await task.save();
    }

    const updatedTask = await Task.findById(taskId)
      .populate("logs.updatedBy", "name email")
      .populate("project", "projectName");

    res.status(200).json({
      success: true,
      message: "Time logged successfully",
      task: updatedTask,
      totalHours: updatedTask.actualHours
    });
  } catch (error) {
    return handleError(res, error, "Error logging time");
  }
};

/**
 * @desc Update task status by employee
 * @route PATCH /api/employee/tasks/:taskId/status
 * @access Private (Employee only)
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'in-progress', 'review', 'blocked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed: pending, in-progress, review, blocked"
      });
    }

    const task = await Task.findOne({
      _id: taskId,
      assignedTo: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to you"
      });
    }

    task.status = status;
    
    // Add employee response when changing status
    if (notes) {
      task.employeeResponses.push({
        message: notes.trim(),
        type: status === 'blocked' ? 'issue' : 'progress',
        createdBy: req.user._id
      });
    }

    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate("project", "projectName")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: `Task status updated to ${status}`,
      task: updatedTask
    });
  } catch (error) {
    return handleError(res, error, "Error updating task status");
  }
};

/**
 * @desc Add employee response/update to task
 * @route POST /api/employee/tasks/:taskId/response
 * @access Private (Employee only)
 */
export const addTaskResponse = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message, type = 'progress' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Response message is required"
      });
    }

    const validTypes = ['progress', 'issue', 'pending-info'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid response type. Allowed: progress, issue, pending-info"
      });
    }

    const task = await Task.findOne({
      _id: taskId,
      assignedTo: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to you"
      });
    }

    task.employeeResponses.push({
      message: message.trim(),
      type,
      createdBy: req.user._id
    });

    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate("employeeResponses.createdBy", "name email")
      .populate("project", "projectName");

    // Send notification to task creator
    if (task.createdBy) {
      await Notification.create({
        sender: req.user._id,
        receivers: [task.createdBy],
        title: "Task Update",
        message: `${req.user.name} added a ${type} update to task: ${task.title}`,
        type: type === 'issue' ? 'warning' : 'info',
        actionLink: `/tasks/${taskId}`,
        meta: { taskId, responseType: type }
      });
    }

    res.status(200).json({
      success: true,
      message: "Response added successfully",
      task: updatedTask
    });
  } catch (error) {
    return handleError(res, error, "Error adding task response");
  }
};

/* ==================== PERFORMANCE TAB ==================== */

/**
 * @desc Get performance feedback for employee
 * @route GET /api/employee/performance
 * @access Private (Employee only)
 */
export const getMyPerformance = async (req, res) => {
  try {
    const { timeframe = '30' } = req.query; // Default last 30 days
    
    const daysAgo = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get performance data from reports with feedback
    const reports = await Report.find({
      $or: [
        { createdBy: req.user._id },
        { forUser: req.user._id }
      ],
      createdAt: { $gte: startDate },
      'feedbacks.0': { $exists: true } // Only reports with feedback
    })
      .populate("feedbacks.givenBy", "name email role")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Get task completion statistics
    const tasks = await Task.find({
      assignedTo: req.user._id,
      createdAt: { $gte: startDate }
    }).select("status actualHours dueDate createdAt");

    // Calculate performance metrics
    const performanceMetrics = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      onTimeCompletion: tasks.filter(t => 
        t.status === 'completed' && 
        t.dueDate && 
        new Date(t.dueDate) >= startDate
      ).length,
      totalHoursLogged: tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
      averageRating: 0,
      feedbackCount: 0
    };

    // Calculate average rating from feedback
    const allFeedbacks = reports.flatMap(r => r.feedbacks);
    const ratingsWithValues = allFeedbacks.filter(f => f.rating);
    
    if (ratingsWithValues.length > 0) {
      performanceMetrics.averageRating = (
        ratingsWithValues.reduce((sum, f) => sum + f.rating, 0) / ratingsWithValues.length
      ).toFixed(1);
    }
    
    performanceMetrics.feedbackCount = allFeedbacks.length;

    // Completion rate
    performanceMetrics.completionRate = performanceMetrics.totalTasks > 0 
      ? Math.round((performanceMetrics.completedTasks / performanceMetrics.totalTasks) * 100) 
      : 0;

    // On-time completion rate
    performanceMetrics.onTimeRate = performanceMetrics.completedTasks > 0
      ? Math.round((performanceMetrics.onTimeCompletion / performanceMetrics.completedTasks) * 100)
      : 0;

    res.status(200).json({
      success: true,
      timeframe: `${daysAgo} days`,
      metrics: performanceMetrics,
      reports,
      recentFeedback: allFeedbacks.slice(0, 10) // Latest 10 feedback entries
    });
  } catch (error) {
    return handleError(res, error, "Error fetching performance data");
  }
};

/* ==================== REPORTS TAB ==================== */

/**
 * @desc Get my reports
 * @route GET /api/employee/reports
 * @access Private (Employee only)
 */
export const getMyReports = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;
    
    let filter = {
      $or: [
        { createdBy: req.user._id },
        { forUser: req.user._id }
      ]
    };
    
    if (type && type !== 'all') filter.type = type;
    if (status && status !== 'all') filter.status = status;

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
      reports
    });
  } catch (error) {
    return handleError(res, error, "Error fetching reports");
  }
};

/**
 * @desc Submit daily report
 * @route POST /api/employee/reports/daily
 * @access Private (Employee only)
 */
export const submitDailyReport = async (req, res) => {
  try {
    const { content, tasksCompleted = 0, tasksPending = 0, projectStats } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Report content is required"
      });
    }

    // Check if already submitted today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

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

    // Get actual task stats if not provided
    let actualStats = { done: 0, inProgress: 0, selected: 0 };
    
    if (projectStats) {
      actualStats = {
        done: Math.max(0, parseInt(projectStats.done) || 0),
        inProgress: Math.max(0, parseInt(projectStats.inProgress) || 0),
        selected: Math.max(0, parseInt(projectStats.selected) || 0)
      };
    } else {
      // Auto-calculate from user's tasks
      const userTasks = await Task.find({ assignedTo: req.user._id });
      actualStats = {
        done: userTasks.filter(t => t.status === 'completed').length,
        inProgress: userTasks.filter(t => t.status === 'in-progress').length,
        selected: userTasks.length
      };
    }

    const report = await Report.create({
      type: "daily",
      createdBy: req.user._id,
      forUser: req.user._id,
      content: content.trim(),
      tasksCompleted: Math.max(0, parseInt(tasksCompleted) || 0),
      tasksPending: Math.max(0, parseInt(tasksPending) || 0),
      projectStats: actualStats,
      status: "submitted"
    });

    const populatedReport = await Report.findById(report._id)
      .populate("createdBy", "name email role");

    // Send notification to team lead if exists
    if (req.user.teamLead) {
      await Notification.create({
        sender: req.user._id,
        receivers: [req.user.teamLead],
        title: "Daily Report Submitted",
        message: `${req.user.name} has submitted their daily report`,
        type: 'info',
        actionLink: `/reports/${report._id}`,
        meta: { reportId: report._id, reportType: 'daily' }
      });
    }

    res.status(201).json({
      success: true,
      message: "Daily report submitted successfully",
      report: populatedReport
    });
  } catch (error) {
    return handleError(res, error, "Error submitting daily report");
  }
};

/**
 * @desc Create general report
 * @route POST /api/employee/reports
 * @access Private (Employee only)
 */
export const createReport = async (req, res) => {
  try {
    const { type, content, tasksCompleted = 0, tasksPending = 0, projectStats } = req.body;

    if (!type || !content) {
      return res.status(400).json({
        success: false,
        message: "Report type and content are required"
      });
    }

    if (!['daily', 'monthly'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report type. Must be 'daily' or 'monthly'"
      });
    }

    const validatedProjectStats = projectStats ? {
      done: Math.max(0, parseInt(projectStats.done) || 0),
      inProgress: Math.max(0, parseInt(projectStats.inProgress) || 0),
      selected: Math.max(0, parseInt(projectStats.selected) || 0)
    } : { done: 0, inProgress: 0, selected: 0 };

    const report = await Report.create({
      type,
      createdBy: req.user._id,
      forUser: req.user._id,
      content: content.trim(),
      tasksCompleted: Math.max(0, parseInt(tasksCompleted) || 0),
      tasksPending: Math.max(0, parseInt(tasksPending) || 0),
      projectStats: validatedProjectStats
    });

    const populatedReport = await Report.findById(report._id)
      .populate("createdBy", "name email role");

    res.status(201).json({
      success: true,
      message: "Report created successfully",
      report: populatedReport
    });
  } catch (error) {
    return handleError(res, error, "Error creating report");
  }
};

/* ==================== NOTIFICATIONS ==================== */

/**
 * @desc Get notifications for employee
 * @route GET /api/employee/notifications
 * @access Private (Employee only)
 */
export const getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    let filter = { receivers: req.user._id };
    
    if (unreadOnly === 'true') {
      filter.readBy = { $ne: req.user._id };
    }

    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find(filter)
      .populate("sender", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      receivers: req.user._id,
      readBy: { $ne: req.user._id }
    });

    // Add isRead status to each notification
    const notificationsWithStatus = notifications.map(notification => {
      const notifObj = notification.toObject();
      notifObj.isRead = notification.readBy.includes(req.user._id);
      return notifObj;
    });

    res.status(200).json({
      success: true,
      notifications: notificationsWithStatus,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      unreadCount
    });
  } catch (error) {
    return handleError(res, error, "Error fetching notifications");
  }
};

/* ==================== DASHBOARD OVERVIEW ==================== */

/**
 * @desc Get dashboard overview data
 * @route GET /api/employee/dashboard
 * @access Private (Employee only)
 */
export const getDashboardOverview = async (req, res) => {
  try {
    // Get current date ranges
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get project count
    const projectCount = await Project.countDocuments({
      employees: req.user._id,
      status: { $nin: ['cancelled', 'archived'] }
    });

    // Get task statistics
    const allTasks = await Task.find({ assignedTo: req.user._id });
    const taskStats = {
      total: allTasks.length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      inProgress: allTasks.filter(t => t.status === 'in-progress').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      overdue: allTasks.filter(t => 
        t.dueDate && 
        new Date(t.dueDate) < new Date() && 
        t.status !== 'completed'
      ).length
    };

    // Get recent activity
    const recentTasks = await Task.find({ assignedTo: req.user._id })
      .populate("project", "projectName")
      .sort({ updatedAt: -1 })
      .limit(5);

    // Get weekly time logged
    const weeklyTasks = await Task.find({
      assignedTo: req.user._id,
      "logs.0": { $exists: true },
      updatedAt: { $gte: startOfWeek }
    });

    const weeklyHours = weeklyTasks.reduce((total, task) => {
      const weeklyLogs = task.logs.filter(log => 
        new Date(log.createdAt || log.updatedAt) >= startOfWeek
      );
      return total + weeklyLogs.reduce((sum, log) => sum + (log.totalTime || 0), 0);
    }, 0) / 60; // Convert minutes to hours

    // Get unread notifications count
    const unreadNotifications = await Notification.countDocuments({
      receivers: req.user._id,
      readBy: { $ne: req.user._id }
    });

    // Check if daily report submitted today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const dailyReportSubmitted = await Report.exists({
      createdBy: req.user._id,
      type: "daily",
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const overview = {
      projectCount,
      taskStats,
      weeklyHours: Math.round(weeklyHours * 100) / 100, // Round to 2 decimal places
      unreadNotifications,
      dailyReportSubmitted: !!dailyReportSubmitted,
      recentActivity: recentTasks.map(task => ({
        id: task._id,
        title: task.title,
        project: task.project?.projectName || 'No Project',
        status: task.status,
        updatedAt: task.updatedAt
      }))
    };

    res.status(200).json({
      success: true,
      overview
    });
  } catch (error) {
    return handleError(res, error, "Error fetching dashboard overview");
  }
};

/* ==================== ASSETS ==================== */

/**
 * @desc Get my assigned assets
 * @route GET /api/employee/assets
 * @access Private (Employee only)
 */
export const getMyAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ assignedTo: req.user._id })
      .populate("assignedBy", "name email")
      .sort({ assignmentDate: -1 });

    res.status(200).json({
      success: true,
      count: assets.length,
      assets
    });
  } catch (error) {
    return handleError(res, error, "Error fetching assets");
  }
};

/**
 * @desc Request asset return
 * @route POST /api/employee/assets/:assetId/request-return
 * @access Private (Employee only)
 */
export const requestAssetReturn = async (req, res) => {
  try {
    const { assetId } = req.params;
    const { reason, notes } = req.body;

    const asset = await Asset.findOne({
      _id: assetId,
      assignedTo: req.user._id
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found or not assigned to you"
      });
    }

    if (asset.returnStatus !== 'none') {
      return res.status(400).json({
        success: false,
        message: "Return request already exists for this asset"
      });
    }

    // Use the model method
    await asset.requestReturn(req.user._id, reason, notes);

    res.status(200).json({
      success: true,
      message: "Asset return requested successfully",
      asset
    });
  } catch (error) {
    return handleError(res, error, "Error requesting asset return");
  }
};

// export {
//   getMyProjects,
//   getProjectDetails,
//   getMyTasks,
//   getTaskDetails,
//   logTimeOnTask,
//   updateTaskStatus,
//   addTaskResponse,
//   getMyPerformance,
//   getMyReports,
//   submitDailyReport,
//   createReport,
//   getMyNotifications,
//   getDashboardOverview,
//   getMyAssets,

// };