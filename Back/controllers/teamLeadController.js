// controllers/teamLeadController.js
import Project from "../models/Project.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Report from "../models/Report.js";
import Notification from "../models/Notification.js";

// Additional functions for teamLeadController.js


/**
 * @desc Get projects with task details for teamlead (for Project Overview tab)
 * @route GET /api/teamlead/projects/overview
 * @access Private (TeamLead only)
 */
export const getProjectsWithTasks = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({
        success: false,
        message: "Only team leads can access project overview"
      });
    }

    // Get projects led by this teamlead
    const projects = await Project.find({ teamLead: req.user._id })
      .populate("teamLead", "name email")
      .populate("employees", "name email")
      .populate("createdBy", "name email")
      .sort({ updatedAt: -1 });

    // Get all tasks created by this teamlead
    const tasks = await Task.find({ createdBy: req.user._id })
      .populate("assignedTo", "name email")
      .populate("project", "projectName clientName");

    // Combine project data with task statistics
    const projectsWithTaskData = projects.map(project => {
      const projectTasks = tasks.filter(task => 
        task.project && task.project._id.toString() === project._id.toString()
      );

      const taskStats = {
        total: projectTasks.length,
        pending: projectTasks.filter(t => t.status === "pending").length,
        inProgress: projectTasks.filter(t => t.status === "in-progress").length,
        review: projectTasks.filter(t => t.status === "review").length,
        completed: projectTasks.filter(t => t.status === "completed").length,
        blocked: projectTasks.filter(t => t.status === "blocked").length
      };

      return {
        ...project.toObject(),
        taskStats,
        recentTasks: projectTasks.slice(0, 5) // Get recent 5 tasks
      };
    });

    res.status(200).json({
      success: true,
      count: projectsWithTaskData.length,
      projects: projectsWithTaskData
    });
  } catch (error) {
    console.error("Get projects with tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching projects with task data",
      error: error.message
    });
  }
};

/**
 * @desc Get team members with their assigned tasks (for Team Management tab)
 * @route GET /api/teamlead/team/with-tasks
 * @access Private (TeamLead only)
 */
export const getTeamWithTasks = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({
        success: false,
        message: "Only team leads can view team with tasks"
      });
    }

    // Get team members
    const teamMembers = await User.find({
      teamLead: req.user._id,
      role: "employee",
      isActive: true
    }).select("-password -resetPasswordToken -resetPasswordExpire");

    // Get all tasks created by this teamlead
    const tasks = await Task.find({ createdBy: req.user._id })
      .populate("assignedTo", "name email")
      .populate("project", "projectName clientName");

    // Combine team members with their tasks
    const teamWithTasks = teamMembers.map(member => {
      const memberTasks = tasks.filter(task => 
        task.assignedTo && task.assignedTo._id.toString() === member._id.toString()
      );

      const taskStats = {
        total: memberTasks.length,
        pending: memberTasks.filter(t => t.status === "pending").length,
        inProgress: memberTasks.filter(t => t.status === "in-progress").length,
        review: memberTasks.filter(t => t.status === "review").length,
        completed: memberTasks.filter(t => t.status === "completed").length,
        blocked: memberTasks.filter(t => t.status === "blocked").length
      };

      return {
        ...member.toObject(),
        tasks: memberTasks,
        taskStats
      };
    });

    // Also get tasks assigned to non-team members (if any)
    const nonTeamTasks = tasks.filter(task => 
      !task.assignedTo || !teamMembers.some(member => 
        member._id.toString() === task.assignedTo._id.toString()
      )
    );

    res.status(200).json({
      success: true,
      count: teamWithTasks.length,
      teamMembers: teamWithTasks,
      unassignedTasks: nonTeamTasks,
      totalTasks: tasks.length
    });
  } catch (error) {
    console.error("Get team with tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching team with tasks",
      error: error.message
    });
  }
};

/**
 * @desc Get dashboard statistics for teamlead
 * @route GET /api/teamlead/dashboard/stats
 * @access Private (TeamLead only)
 */
export const getDashboardStats = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({
        success: false,
        message: "Only team leads can view dashboard stats"
      });
    }

    // Get team members count
    const teamMembersCount = await User.countDocuments({
      teamLead: req.user._id,
      role: "employee",
      isActive: true
    });

    // Get available employees (not assigned to any team)
    const availableEmployeesCount = await User.countDocuments({
      role: "employee",
      isActive: true,
      $or: [
        { teamLead: { $exists: false } },
        { teamLead: null }
      ]
    });

    // Get projects led by this teamlead
    const projectsCount = await Project.countDocuments({ teamLead: req.user._id });

    // Get tasks created by this teamlead
    const tasks = await Task.find({ createdBy: req.user._id });
    
    const taskStats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === "pending").length,
      inProgress: tasks.filter(t => t.status === "in-progress").length,
      review: tasks.filter(t => t.status === "review").length,
      completed: tasks.filter(t => t.status === "completed").length,
      blocked: tasks.filter(t => t.status === "blocked").length
    };

    // Get project stats
    const projects = await Project.find({ teamLead: req.user._id });
    const projectStats = {
      total: projects.length,
      pending: projects.filter(p => p.status === "pending").length,
      active: projects.filter(p => p.status === "active").length,
      inProgress: projects.filter(p => p.status === "in-progress").length,
      completed: projects.filter(p => p.status === "completed").length,
      onHold: projects.filter(p => p.status === "on-hold").length
    };

    res.status(200).json({
      success: true,
      stats: {
        teamSize: teamMembersCount,
        availableEmployees: availableEmployeesCount,
        projects: projectStats,
        tasks: taskStats
      }
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message
    });
  }
};

/**
 * @desc Get all employees with task assignment status
 * @route GET /api/teamlead/employees/task-status
 * @access Private (TeamLead only)
 */
export const getEmployeesWithTaskStatus = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({
        success: false,
        message: "Only team leads can view employee task status"
      });
    }

    // Get all employees
    const allEmployees = await User.find({
      role: "employee",
      isActive: true
    }).select("-password -resetPasswordToken -resetPasswordExpire");

    // Get team members
    const teamMembers = await User.find({
      teamLead: req.user._id,
      role: "employee",
      isActive: true
    });

    // Get available employees
    const availableEmployees = await User.find({
      role: "employee",
      isActive: true,
      $or: [
        { teamLead: { $exists: false } },
        { teamLead: null }
      ]
    });

    // Get tasks created by this teamlead
    const tasks = await Task.find({ createdBy: req.user._id })
      .populate("assignedTo", "name email");

    // Categorize employees
    const employeesWithStatus = allEmployees.map(employee => {
      const isTeamMember = teamMembers.some(tm => tm._id.toString() === employee._id.toString());
      const isAvailable = availableEmployees.some(ae => ae._id.toString() === employee._id.toString());
      
      const assignedTasks = tasks.filter(task => 
        task.assignedTo && task.assignedTo._id.toString() === employee._id.toString()
      );

      return {
        ...employee.toObject(),
        status: isTeamMember ? 'team-member' : (isAvailable ? 'available' : 'assigned-elsewhere'),
        isMyTeamMember: isTeamMember,
        isAvailable: isAvailable,
        tasksCount: assignedTasks.length,
        activeTasks: assignedTasks.filter(t => ['pending', 'in-progress', 'review'].includes(t.status)).length
      };
    });

    res.status(200).json({
      success: true,
      count: employeesWithStatus.length,
      employees: employeesWithStatus,
      summary: {
        total: allEmployees.length,
        teamMembers: teamMembers.length,
        available: availableEmployees.length,
        assignedElsewhere: allEmployees.length - teamMembers.length - availableEmployees.length
      }
    });
  } catch (error) {
    console.error("Get employees with task status error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employees with task status",
      error: error.message
    });
  }
};

/**
 * @desc Get task assignment overview for teamlead
 * @route GET /api/teamlead/tasks/assignment-overview
 * @access Private (TeamLead only)
 */
export const getTaskAssignmentOverview = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({
        success: false,
        message: "Only team leads can view task assignment overview"
      });
    }

    // Get all tasks created by this teamlead
    const tasks = await Task.find({ createdBy: req.user._id })
      .populate("assignedTo", "name email")
      .populate("project", "projectName clientName")
      .sort({ createdAt: -1 });

    // Group tasks by assignee
    const tasksByEmployee = {};
    const unassignedTasks = [];

    tasks.forEach(task => {
      if (task.assignedTo) {
        const employeeId = task.assignedTo._id.toString();
        if (!tasksByEmployee[employeeId]) {
          tasksByEmployee[employeeId] = {
            employee: task.assignedTo,
            tasks: [],
            stats: {
              total: 0,
              pending: 0,
              inProgress: 0,
              review: 0,
              completed: 0,
              blocked: 0
            }
          };
        }
        tasksByEmployee[employeeId].tasks.push(task);
        tasksByEmployee[employeeId].stats.total++;
        tasksByEmployee[employeeId].stats[task.status.replace('-', '')]++;
      } else {
        unassignedTasks.push(task);
      }
    });

    // Convert to array
    const employeeTaskSummary = Object.values(tasksByEmployee);

    // Overall stats
    const overallStats = {
      totalTasks: tasks.length,
      assignedTasks: tasks.length - unassignedTasks.length,
      unassignedTasks: unassignedTasks.length,
      employeesWithTasks: employeeTaskSummary.length,
      statusBreakdown: {
        pending: tasks.filter(t => t.status === "pending").length,
        inProgress: tasks.filter(t => t.status === "in-progress").length,
        review: tasks.filter(t => t.status === "review").length,
        completed: tasks.filter(t => t.status === "completed").length,
        blocked: tasks.filter(t => t.status === "blocked").length
      }
    };

    res.status(200).json({
      success: true,
      overallStats,
      employeeTaskSummary,
      unassignedTasks,
      recentTasks: tasks.slice(0, 10)
    });
  } catch (error) {
    console.error("Get task assignment overview error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching task assignment overview",
      error: error.message
    });
  }
};
// 1) Get projects visible to teamlead
export const getVisibleProjects = async (req, res) => {
  try {
    const all = await Project.find().populate("createdBy", "name email");
    // For each project, if assignedTeamLead === req.user._id => full view; otherwise limited view
    const result = all.map(p => {
      if (p.assignedTeamLead && p.assignedTeamLead.toString() === req.user._id.toString()) {
        return p; // full
      }
      // limited view for unassigned or other teamlead
      const limited = {
        _id: p._id,
        name: p.name,
        clientName: p.clientName,
        totalPrice: p.totalPrice,
        status: p.status,
        category: p.category,
        priority: p.priority,
        deadline: p.deadline,
        createdBy: p.createdBy
      };
      return limited;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2) Pick a project
export const pickProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.assignedTeamLead && project.assignedTeamLead.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: "Project already assigned to another teamlead" });
    }
    project.assignedTeamLead = req.user._id;
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3) My projects (full)
export const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ assignedTeamLead: req.user._id }).populate("assignedEmployees", "name email");
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4) Team members (employees only)
export const getTeamMembers = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select("-password");
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5) Assign task to employee (teamlead only on projects assigned to them)
export const assignTask = async (req, res) => {
  try {
    const { title, description, assignedTo, project, dueDate, projectLink } = req.body;
    // Check project belongs to teamlead
    const proj = await Project.findById(project);
    if (!proj) return res.status(404).json({ message: "Project not found" });
    if (!proj.assignedTeamLead || proj.assignedTeamLead.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only assign tasks for projects you own" });
    }
    const task = await Task.create({
      title, description, assignedTo, project, dueDate, projectLink, createdBy: req.user._id
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6) Reassign task
export const reassignTask = async (req, res) => {
  try {
    const { newEmployeeId } = req.body;
    const task = await Task.findById(req.params.id).populate("project");
    if (!task) return res.status(404).json({ message: "Task not found" });
    // Ensure teamlead owns project
    if (!task.project.assignedTeamLead || task.project.assignedTeamLead.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed to reassign task" });
    }
    task.assignedTo = newEmployeeId;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 7) Get tasks assigned by this teamlead
export const getMyAssignedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ createdBy: req.user._id }).populate("assignedTo project");
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 8) Submit report (daily/monthly)
export const submitReport = async (req, res) => {
  try {
    const { type, content, projectStats, tasksCompleted, tasksPending } = req.body;
    const report = await Report.create({
      type, createdBy: req.user._id, content, projectStats, tasksCompleted, tasksPending
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 9) Send notification to admin or user
export const sendNotification = async (req, res) => {
  try {
    const { receiverId, message, type } = req.body;
    if (!receiverId) return res.status(400).json({ message: "receiverId required" });
    const n = await Notification.create({ sender: req.user._id, receiver: receiverId, message, type });
    res.status(201).json(n);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 10) View employee reports (teamlead)
export const getEmployeeReports = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const reports = await Report.find({ createdBy: employeeId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* ----------------------- PROJECT ACCESS ----------------------- */




/* ----------------------- REPORTING ----------------------- */
export const reviewReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    report.status = req.body.status || "reviewed";
    report.feedback = req.body.feedback || "";
    await report.save();

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const giveFeedback = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    report.feedback = req.body.feedback;
    await report.save();

    res.json({ message: "Feedback added", report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ----------------------- NOTIFICATIONS ----------------------- */
export const sendNotificationToEmployees = async (req, res) => {
  try {
    const { recipients, message } = req.body;
    const notification = await Notification.create({ recipients, message, sender: req.user._id });
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
