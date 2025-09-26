// controllers/userController.js
import User from "../models/User.js";
import Asset from "../models/Asset.js";
import Task from "../models/Task.js";
import { Project } from "../models/Project.js";
import mongoose from "mongoose";

/* ----------------------- USER MANAGEMENT ----------------------- */

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new user (admin only)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, cnic, phone, role } = req.body;

    // Validation
    if (!name || !email || !password || !cnic || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ message: "Email already exists" });

    const cnicExists = await User.findOne({ cnic });
    if (cnicExists) return res.status(400).json({ message: "CNIC already registered" });

    const user = await User.create({ name, email, password, cnic, phone, role: role || "employee" });
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({ success: true, user: userResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user by ID (admin only)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(id, req.body, { 
      new: true,
      runValidators: true 
    }).select("-password");
    
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete user by ID (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "User not found" });

    // Remove assigned assets and tasks
    await Asset.updateMany({ assignedTo: deleted._id }, { $unset: { assignedTo: "" } });
    await Task.updateMany({ assignedTo: deleted._id }, { $unset: { assignedTo: "" } });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Promote user to team lead (admin only)
export const promoteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "teamlead") {
      return res.status(400).json({ message: "User is already a team lead" });
    }

    user.role = "teamlead";
    // Remove from current team if they are an employee
    if (user.teamLead) {
      user.teamLead = undefined;
    }
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ success: true, message: "User promoted to Team Lead", user: userResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all users filtered by role
export const getAllUsersFiltered = async (req, res) => {
  try {
    let users;

    if (req.user.role === "admin") {
      // Admin sees all users
      users = await User.find()
        .select("-password")
        .populate('teamLead', 'name email');
    } else if (req.user.role === "teamlead") {
      // Teamlead sees only employees (exclude admins & other teamleads)
      users = await User.find({ role: "employee" })
        .select("-password")
        .populate('teamLead', 'name email');
    } else {
      return res.status(403).json({ message: "Not authorized to view users" });
    }

    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ----------------------- EMPLOYEE MANAGEMENT ----------------------- */

/**
 * @desc Get all employees (Admin/TeamLead only)
 * @route GET /api/users/employees
 * @access Private (Admin/TeamLead)
 */
export const getEmployees = async (req, res) => {
  try {
    if (!["admin", "teamlead"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view employees"
      });
    }

    // Get ALL employees based on role only (ignore isActive)
    const employees = await User.find({ 
      role: "employee"
    })
      .populate("teamLead", "name email")
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employees",
      error: error.message
    });
  }
};

/**
 * @desc Get available employees (not assigned to any team)
 * @route GET /api/users/employees/available
 * @access Private (Admin/TeamLead)
 */
export const getAvailableEmployees = async (req, res) => {
  try {
    if (!["admin", "teamlead"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view available employees"
      });
    }

    const availableEmployees = await User.findAvailableEmployees();

    res.status(200).json({
      success: true,
      count: availableEmployees.length,
      employees: availableEmployees
    });
  } catch (error) {
    console.error("Get available employees error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching available employees",
      error: error.message
    });
  }
};

/**
 * @desc Get team members assigned to logged-in teamlead
 * @route GET /api/users/team/my-team
 * @access Private (TeamLead only)
 */
export const getMyTeam = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({
        success: false,
        message: "Only team leads can view their team"
      });
    }

    const teamMembers = await User.findTeamMembers(req.user._id);

    res.status(200).json({
      success: true,
      count: teamMembers.length,
      teamMembers
    });
  } catch (error) {
    console.error("Get my team error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching team members",
      error: error.message
    });
  }
};

/**
 * @desc Assign employees to team (TeamLead only)
 * @route POST /api/users/assign-team
 * @access Private (TeamLead only)
 */
export const assignTeam = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({
        success: false,
        message: "Only team leads can assign team members"
      });
    }

    const { employeeIds } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Employee IDs array is required"
      });
    }

    // Validate employee IDs
    for (const id of employeeIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid employee ID: ${id}`
        });
      }
    }

    // Check if employees exist and are available
    const employees = await User.find({
      _id: { $in: employeeIds },
      role: "employee",
      isActive: true,
      $or: [
        { teamLead: { $exists: false } },
        { teamLead: null }
      ]
    });

    if (employees.length !== employeeIds.length) {
      const foundIds = employees.map(emp => emp._id.toString());
      const notFound = employeeIds.filter(id => !foundIds.includes(id));
      return res.status(400).json({
        success: false,
        message: `Some employees are not available or don't exist: ${notFound.join(', ')}`
      });
    }

    // Assign employees to team
    await User.updateMany(
      { _id: { $in: employeeIds } },
      { teamLead: req.user._id }
    );

    // Fetch updated employees
    const updatedEmployees = await User.find({ _id: { $in: employeeIds } })
      .select("-password -resetPasswordToken -resetPasswordExpire");

    res.status(200).json({
      success: true,
      message: `Successfully assigned ${employees.length} employee(s) to your team`,
      assignedEmployees: updatedEmployees
    });
  } catch (error) {
    console.error("Assign team error:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning team members",
      error: error.message
    });
  }
};

/**
 * @desc Remove employees from team (TeamLead only)
 * @route POST /api/users/remove-team
 * @access Private (TeamLead only)
 */
export const removeFromTeam = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({
        success: false,
        message: "Only team leads can remove team members"
      });
    }

    const { employeeIds } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Employee IDs array is required"
      });
    }

    // Check if employees belong to this teamlead
    const employees = await User.find({
      _id: { $in: employeeIds },
      teamLead: req.user._id,
      role: "employee"
    });

    if (employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid team members found to remove"
      });
    }

    // Remove employees from team
    await User.updateMany(
      { _id: { $in: employeeIds }, teamLead: req.user._id },
      { $unset: { teamLead: 1 } }
    );

    res.status(200).json({
      success: true,
      message: `Successfully removed ${employees.length} employee(s) from your team`
    });
  } catch (error) {
    console.error("Remove from team error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing team members",
      error: error.message
    });
  }
};

/* ----------------------- TASK MANAGEMENT FOR TEAMLEAD ----------------------- */

/**
 * @desc Create/Assign task to employee (TeamLead/Admin only) - TeamLead version
 * @route POST /api/users/tasks/assign
 * @access Private (TeamLead only)
 */
export const assignTask = async (req, res) => {
  try {
    if (!["teamlead", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only team leads and admins can assign tasks"
      });
    }

    const { title, description, specialInstructions, assignedTo, priority, dueDate, project, projectLink } = req.body;

    if (!title || !description || !assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and assigned employee are required"
      });
    }

    // For teamlead, validate assigned employee belongs to their team
    if (req.user.role === "teamlead") {
      const employee = await User.findOne({
        _id: assignedTo,
        teamLead: req.user._id,
        role: "employee",
        isActive: true
      });

      if (!employee) {
        return res.status(400).json({
          success: false,
          message: "Employee not found in your team or is inactive"
        });
      }
    }

    // If project is specified, validate access for teamlead
    if (project && req.user.role === "teamlead") {
      const projectDoc = await Project.findById(project);
      if (!projectDoc || projectDoc.teamLead.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only assign tasks for projects you lead"
        });
      }
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      specialInstructions,
      assignedTo,
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : undefined,
      project: project || undefined,
      projectLink,
      createdBy: req.user._id,
      status: "pending"
    });

    // Populate task details
    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("project", "projectName clientName")
      .populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Task assigned successfully",
      task: populatedTask
    });
  } catch (error) {
    console.error("Assign task error:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning task",
      error: error.message
    });
  }
};

/**
 * @desc Get tasks assigned by teamlead
 * @route GET /api/users/tasks/my-assigned
 * @access Private (TeamLead only)
 */
export const getMyAssignedTasks = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({
        success: false,
        message: "Only team leads can view assigned tasks"
      });
    }

    const tasks = await Task.find({ createdBy: req.user._id })
      .populate("assignedTo", "name email")
      .populate("project", "projectName clientName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error("Get my assigned tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching assigned tasks",
      error: error.message
    });
  }
};

/**
 * @desc Update task status (TeamLead/Admin only)
 * @route PATCH /api/users/tasks/:taskId/status
 * @access Private (TeamLead/Admin)
 */
export const updateTaskStatus = async (req, res) => {
  try {
    if (!["teamlead", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only team leads and admins can update task status"
      });
    }

    const { taskId } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "in-progress", "review", "completed", "blocked"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status provided"
      });
    }

    // Build query based on role
    let query = { _id: taskId };
    if (req.user.role === "teamlead") {
      query.createdBy = req.user._id; // TeamLead can only update tasks they created
    }

    const task = await Task.findOneAndUpdate(
      query,
      { status },
      { new: true }
    ).populate("assignedTo", "name email");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not authorized"
      });
    }

    res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      task
    });
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating task status",
      error: error.message
    });
  }
};

/**
 * @desc Get all tasks (Role-based) - TeamLead version
 * @route GET /api/users/tasks
 * @access Private (TeamLead/Admin)
 */
export const getTasks = async (req, res) => {
  try {
    if (!["teamlead", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view tasks"
      });
    }

    let filter = {};
    
    if (req.user.role === "teamlead") {
      // TeamLead sees only tasks they created
      filter.createdBy = req.user._id;
    }
    // Admin sees all tasks (no filter)

    const { status, priority, project } = req.query;

    // Add query filters
    if (status && status !== 'all') {
      filter.status = status;
    }

    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    if (project && project !== 'all') {
      filter.project = project;
    }

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email")
      .populate("project", "projectName clientName deadline")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tasks",
      error: error.message
    });
  }
};

/**
 * @desc Delete task (TeamLead/Admin only)
 * @route DELETE /api/users/tasks/:taskId
 * @access Private (TeamLead/Admin)
 */
export const deleteTask = async (req, res) => {
  try {
    if (!["teamlead", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only team leads and admins can delete tasks"
      });
    }

    const { taskId } = req.params;

    // Build query based on role
    let query = { _id: taskId };
    if (req.user.role === "teamlead") {
      query.createdBy = req.user._id; // TeamLead can only delete tasks they created
    }

    const task = await Task.findOneAndDelete(query);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not authorized"
      });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting task",
      error: error.message
    });
  }
};

/**
 * @desc Get tasks for specific employee (TeamLead only)
 * @route GET /api/users/employees/:employeeId/tasks
 * @access Private (TeamLead only)
 */
export const getEmployeeTasks = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({
        success: false,
        message: "Only team leads can view employee tasks"
      });
    }

    const { employeeId } = req.params;

    // Verify employee belongs to this teamlead
    const employee = await User.findOne({
      _id: employeeId,
      teamLead: req.user._id,
      role: "employee"
    });

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Employee not found in your team"
      });
    }

    const tasks = await Task.find({
      assignedTo: employeeId,
      createdBy: req.user._id
    })
      .populate("assignedTo", "name email")
      .populate("project", "projectName clientName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email
      },
      tasks
    });
  } catch (error) {
    console.error("Get employee tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employee tasks",
      error: error.message
    });
  }
};

/* ----------------------- PROJECT MANAGEMENT FOR TEAMLEAD ----------------------- */

/**
 * @desc Get projects for teamlead (only projects they lead)
 * @route GET /api/users/projects
 * @access Private (TeamLead only)
 */
export const getProjects = async (req, res) => {
  try {
    if (!["teamlead", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view projects"
      });
    }

    let projects;
    
    if (req.user.role === "admin") {
      // Admin sees all projects
      projects = await Project.find()
        .populate("teamLead", "name email")
        .populate("employees", "name email")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });
    } else if (req.user.role === "teamlead") {
      // TeamLead only sees projects they lead
      projects = await Project.find({ teamLead: req.user._id })
        .populate("teamLead", "name email")
        .populate("employees", "name email")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching projects",
      error: error.message
    });
  }
};

/**
 * @desc Get projects for teamlead to assign tasks
 * @route GET /api/users/projects/for-tasks
 * @access Private (TeamLead only)
 */
export const getProjectsForTasks = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({
        success: false,
        message: "Only team leads can view projects for task assignment"
      });
    }

    const projects = await Project.find({
      teamLead: req.user._id,
      status: { $in: ["active", "in-progress", "pending"] }
    })
      .select("projectName clientName status priority")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error("Get projects for tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching projects",
      error: error.message
    });
  }
};
/**
 * @desc Fetch all employees (TeamLead only) - excludes admins & other teamleads
 * @route GET /api/users/employees/teamlead-view
 * @access Private (TeamLead only)
 */
export const fetchEmployeesData = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({
        success: false,
        message: "Only team leads can fetch employee data",
      });
    }

    // Fetch all employees only (exclude admins & teamleads)
    const employees = await User.find({ role: "employee", isActive: true })
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    console.error("Fetch employees data error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employees data",
      error: error.message,
    });
  }
};


/**
 * @desc Get employee workload summary for team leads
 * @route GET /api/users/employees/workload
 * @access Private (Team Lead)
 */
export const getEmployeeWorkloadSummary = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({ 
        success: false, 
        message: "Only team leads can access employee workload data" 
      });
    }

    // Get workload statistics
    const workloadStats = await User.aggregate([
      {
        $match: { 
          role: 'employee',
          isActive: { $ne: false }
        }
      },
      {
        $lookup: {
          from: 'projects',
          let: { employeeId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$$employeeId', '$employees'] },
                status: { $in: ['pending', 'in-progress', 'active'] }
              }
            }
          ],
          as: 'activeProjects'
        }
      },
      {
        $lookup: {
          from: 'tasks',
          let: { employeeId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$assignedTo', '$$employeeId'] },
                status: { $in: ['pending', 'in-progress'] }
              }
            }
          ],
          as: 'activeTasks'
        }
      },
      {
        $addFields: {
          activeProjectCount: { $size: '$activeProjects' },
          activeTaskCount: { $size: '$activeTasks' },
          workloadLevel: {
            $switch: {
              branches: [
                { case: { $lte: [{ $size: '$activeProjects' }, 1] }, then: 'light' },
                { case: { $lte: [{ $size: '$activeProjects' }, 2] }, then: 'moderate' },
                { case: { $lte: [{ $size: '$activeProjects' }, 3] }, then: 'heavy' }
              ],
              default: 'overloaded'
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          activeProjectCount: 1,
          activeTaskCount: 1,
          workloadLevel: 1
        }
      },
      {
        $sort: { activeProjectCount: 1, name: 1 }
      }
    ]);

    const summary = {
      totalEmployees: workloadStats.length,
      workloadDistribution: {
        light: workloadStats.filter(emp => emp.workloadLevel === 'light').length,
        moderate: workloadStats.filter(emp => emp.workloadLevel === 'moderate').length,
        heavy: workloadStats.filter(emp => emp.workloadLevel === 'heavy').length,
        overloaded: workloadStats.filter(emp => emp.workloadLevel === 'overloaded').length
      },
      averageProjectsPerEmployee: workloadStats.length > 0 ? 
        Math.round((workloadStats.reduce((sum, emp) => sum + emp.activeProjectCount, 0) / workloadStats.length) * 10) / 10 : 0,
      averageTasksPerEmployee: workloadStats.length > 0 ? 
        Math.round((workloadStats.reduce((sum, emp) => sum + emp.activeTaskCount, 0) / workloadStats.length) * 10) / 10 : 0
    };

    res.status(200).json({
      success: true,
      summary,
      employees: workloadStats
    });

  } catch (error) {
    console.error("Get employee workload summary error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employee workload summary",
      error: error.message
    });
  }
};
