// import Task from "../models/Task.js";
// import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { Project } from "../models/Project.js";
/**
 * @desc Create a new task (Teamlead/Admin only)
 */


/**
 * @desc Get all tasks (Teamlead/Admin see all, Employees see only assigned)
 */


/**
 * @desc Get single task by ID
 */


/**
 * @desc Update task (Teamlead/Admin only)
 */


/**
 * @desc Add employee response (Employee only)
 */

/**
 * @desc Add a log entry (time tracking) - Employee/Teamlead/Admin
 */

/**
 * @desc Delete a task (Teamlead/Admin only)
 */



/**
 * @desc Assign a task to an employee (Teamlead/Admin only)
 */

/**
 * @desc Get tasks assigned to the logged-in employee
 */
export const getMyAssignedTasks = async (req, res) => {
  try {
    // Only employees can access this
    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Not authorized to view assigned tasks" });
    }

    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate("project", "projectName clientName deadline")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    console.error("GetMyAssignedTasks Error:", err);
    return res.status(500).json({ success: false, message: "Error fetching assigned tasks", error: err.message });
  }
};
/**
 * @desc Reassign a task to an employee (Teamlead/Admin only)
 * @route PUT /api/tasks/:taskId/reassign
 * @access Teamlead/Admin
 */

/**
 * @desc Employee logs time on a task
 * @route POST /api/tasks/:taskId/log-time
 * @access Employee
 */
export const logTime = async (req, res) => {
  const { taskId } = req.params;
  const { startTime, endTime, description } = req.body;

  try {
    // Only employees can log time
    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Only employees can log time" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    // Ensure the employee is assigned to this task
    if (String(task.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized to log time for this task" });
    }

    // Validate times
    if (!startTime || !endTime || new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ success: false, message: "Invalid start or end time" });
    }

    // Calculate total time in minutes
    const totalMinutes = Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60));

    // Add log entry
    task.logs.push({
      startTime,
      endTime,
      totalTime: totalMinutes,
      description: description || "",
      updatedBy: req.user._id,
    });

    await task.save();

    return res.status(200).json({ success: true, message: "Time logged successfully", task });
  } catch (err) {
    console.error("LogTime Error:", err);
    return res.status(500).json({ success: false, message: "Error logging time", error: err.message });
  }
};
/**
 * @desc Mark a task as complete
 * @route PUT /api/tasks/:taskId/mark-complete
 * @access Employee / Teamlead / Admin
 */

// controllers/taskController.js


/**
 * @desc Create a new task (Teamlead/Admin only)
 * @route POST /api/tasks
 * @access Private (Teamlead/Admin)
 */

/**
 * @desc Get all tasks (Role-based filtering)
 * @route GET /api/tasks
 * @access Private
 */


/**
 * @desc Get single task by ID
 * @route GET /api/tasks/:taskId
 * @access Private
 */


/**
 * @desc Update task (Teamlead/Admin only)
 * @route PUT /api/tasks/:taskId
 * @access Private (Teamlead/Admin)
 */


/**
 * @desc Add employee response (Employee only)
 * @route POST /api/tasks/:taskId/response
 * @access Private (Employee)
 */


/**
 * @desc Add a log entry (time tracking)
 * @route POST /api/tasks/:taskId/log
 * @access Private (Employee/Teamlead/Admin)
 */


/**
 * @desc Delete a task (Teamlead/Admin only)
 * @route DELETE /api/tasks/:taskId
 * @access Private (Teamlead/Admin)
 */


/**
 * @desc Get my tasks as employee
 * @route GET /api/tasks/my-tasks
 * @access Private (Employee only)
 */


/**
 * @desc Update task status by employee
 * @route PATCH /api/tasks/:taskId/employee-status
 * @access Private (Employee only)
 */

// controllers/taskController.js


/**
 * @desc Create a new task (Teamlead/Admin only)
 * @route POST /api/tasks
 * @access Private (Teamlead/Admin)
 */
export const createTask = async (req, res) => {
  try {
    if (!["teamlead", "admin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not authorized to create tasks" });
    }

    const { title, description, specialInstructions, assignedTo, project, dueDate, projectLink, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and description are required" });
    }

    // Validate project
    if (project) {
      const proj = await Project.findById(project);
      if (!proj) return res.status(404).json({ success: false, message: "Project not found" });

      if (req.user.role === "teamlead" && proj.teamLead.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "You can only create tasks for your projects" });
      }
    }

    const newTask = new Task({
      title,
      description,
      specialInstructions,
      assignedTo,
      project,
      dueDate,
      projectLink,
      priority: priority || "medium",
      createdBy: req.user._id,
    });

    await newTask.save();
    const populatedTask = await Task.findById(newTask._id)
      .populate("assignedTo", "name email")
      .populate("project", "projectName clientName")
      .populate("createdBy", "name email role");

    res.status(201).json({ success: true, message: "Task created successfully", task: populatedTask });
  } catch (err) {
    console.error("CreateTask Error:", err);
    res.status(500).json({ success: false, message: "Error creating task", error: err.message });
  }
};

/**
 * @desc Get all tasks (role-based)
 * @route GET /api/tasks
 * @access Private
 */
export const getTasks = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "employee") filter.assignedTo = req.user._id;
    if (req.user.role === "teamlead") filter.createdBy = req.user._id;

    const { status, priority, project } = req.query;
    if (status && status !== "all") filter.status = status;
    if (priority && priority !== "all") filter.priority = priority;
    if (project && project !== "all") filter.project = project;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email")
      .populate("project", "projectName clientName deadline")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    console.error("GetTasks Error:", err);
    res.status(500).json({ success: false, message: "Error fetching tasks", error: err.message });
  }
};

/**
 * @desc Get single task by ID
 * @route GET /api/tasks/:taskId
 * @access Private
 */
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate("assignedTo", "name email")
      .populate("project", "projectName clientName deadline")
      .populate("createdBy", "name email role")
      .populate("logs.updatedBy", "name email")
      .populate("employeeResponses.createdBy", "name email");

    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (req.user.role === "employee" && task.assignedTo._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    if (req.user.role === "teamlead" && task.createdBy._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    res.status(200).json({ success: true, task });
  } catch (err) {
    console.error("GetTaskById Error:", err);
    res.status(500).json({ success: false, message: "Error fetching task", error: err.message });
  }
};

/**
 * @desc Update task (Teamlead/Admin only)
 * @route PUT /api/tasks/:taskId
 * @access Private
 */
export const updateTask = async (req, res) => {
  try {
    if (!["teamlead", "admin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (req.user.role === "teamlead" && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only update your own tasks" });
    }

    Object.assign(task, req.body);
    await task.save();
    const updatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("project", "projectName clientName deadline")
      .populate("createdBy", "name email role");

    res.status(200).json({ success: true, message: "Task updated", task: updatedTask });
  } catch (err) {
    console.error("UpdateTask Error:", err);
    res.status(500).json({ success: false, message: "Error updating task", error: err.message });
  }
};

/**
 * @desc Delete a task (Teamlead/Admin only)
 * @route DELETE /api/tasks/:taskId
 * @access Private
 */
export const deleteTask = async (req, res) => {
  try {
    if (!["teamlead", "admin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (req.user.role === "teamlead" && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete your own tasks" });
    }

    await Task.findByIdAndDelete(req.params.taskId);
    res.status(200).json({ success: true, message: "Task deleted" });
  } catch (err) {
    console.error("DeleteTask Error:", err);
    res.status(500).json({ success: false, message: "Error deleting task", error: err.message });
  }
};

/**
 * @desc Assign a task (Teamlead/Admin)
 */
export const assignTask = createTask;

/**
 * @desc Reassign a task (Teamlead/Admin)
 * @route PUT /api/tasks/:taskId/reassign
 */
export const reassignTask = async (req, res) => {
  try {
    if (!["teamlead", "admin"].includes(req.user.role)) return res.status(403).json({ success: false, message: "Not authorized" });

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    task.assignedTo = req.body.newAssignedTo;
    await task.save();
    res.status(200).json({ success: true, message: "Task reassigned", task });
  } catch (err) {
    console.error("ReassignTask Error:", err);
    res.status(500).json({ success: false, message: "Error reassigning task", error: err.message });
  }
};

/**
 * @desc Add employee response
 * @route POST /api/tasks/:taskId/response
 * @access Employee
 */
export const addEmployeeResponse = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (req.user.role !== "employee" || task.assignedTo.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    task.employeeResponses.push({ message: req.body.message, type: req.body.type || "progress", createdBy: req.user._id });
    await task.save();

    res.status(200).json({ success: true, message: "Response added", task });
  } catch (err) {
    console.error("AddEmployeeResponse Error:", err);
    res.status(500).json({ success: false, message: "Error adding response", error: err.message });
  }
};

/**
 * @desc Add log entry
 * @route POST /api/tasks/:taskId/log
 */
export const addLog = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    task.logs.push({ ...req.body, updatedBy: req.user._id });
    await task.save();

    res.status(200).json({ success: true, message: "Log added", task });
  } catch (err) {
    console.error("AddLog Error:", err);
    res.status(500).json({ success: false, message: "Error adding log", error: err.message });
  }
};

/**
 * @desc Mark complete
 * @route PUT /api/tasks/:taskId/mark-complete
 */
export const markComplete = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    task.status = "completed";
    task.completedBy = req.user._id;
    task.completedAt = new Date();

    await task.save();
    res.status(200).json({ success: true, message: "Task marked complete", task });
  } catch (err) {
    console.error("MarkComplete Error:", err);
    res.status(500).json({ success: false, message: "Error marking complete", error: err.message });
  }
};

/**
 * @desc Get my tasks (Employee only)
 * @route GET /api/tasks/my-tasks
 */
export const getMyTasks = async (req, res) => {
  try {
    if (req.user.role !== "employee") return res.status(403).json({ success: false, message: "Employees only" });

    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate("project", "projectName clientName")
      .populate("createdBy", "name email role");

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    console.error("GetMyTasks Error:", err);
    res.status(500).json({ success: false, message: "Error fetching my tasks", error: err.message });
  }
};

/**
 * @desc Update task status by employee
 * @route PATCH /api/tasks/:taskId/employee-status
 */
export const updateTaskStatusByEmployee = async (req, res) => {
  try {
    if (req.user.role !== "employee") return res.status(403).json({ success: false, message: "Employees only" });

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (task.assignedTo.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Not authorized" });

    task.status = req.body.status;
    await task.save();

    res.status(200).json({ success: true, message: "Task status updated", task });
  } catch (err) {
    console.error("UpdateTaskStatusByEmployee Error:", err);
    res.status(500).json({ success: false, message: "Error updating status", error: err.message });
  }
};
