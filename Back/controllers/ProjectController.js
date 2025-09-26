// controllers/projectController.js
import { Project, ProjectDetails, ProjectGroup } from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

/* ------------------- PROJECT CRUD ------------------- */

/**
 * @desc Create Project with proper initialization
 * @route POST /api/projects
 * @access Private (Admin)
 */
export const addProject = async (req, res) => {
  try {
    const {
      projectName,
      description,
      deadline,
      clientName,
      clientEmail,
      clientPhone,
      projectPlatform,
      profile,
      category,
      priority,
      fixedAmount,
      paymentSchedule,
      scopePolicy,
      hourlyRate,
      estimatedHours,
      milestones,
      onboardingDate,
      visibleToTeamLeads = true
    } = req.body;

    // Validation
    if (!projectName || !category || !clientName) {
      return res.status(400).json({ 
        success: false, 
        message: "Project name, category, and client name are required" 
      });
    }

    if (category === "fixed" && (!fixedAmount || fixedAmount <= 0)) {
      return res.status(400).json({ 
        success: false, 
        message: "Fixed amount is required for fixed projects" 
      });
    }

    if (category === "hourly" && (!hourlyRate || hourlyRate <= 0)) {
      return res.status(400).json({ 
        success: false, 
        message: "Hourly rate is required for hourly projects" 
      });
    }

    // Initialize amounts based on category
    let initialTotalAmount = 0;
    let initialPaidAmount = 0;
    let initialPendingAmount = 0;

    if (category === "fixed") {
      initialTotalAmount = parseFloat(fixedAmount) || 0;
      initialPendingAmount = initialTotalAmount;
    }

    const project = await Project.create({
      projectName,
      description,
      deadline: deadline ? new Date(deadline) : null,
      clientName,
      clientEmail,
      clientPhone,
      projectPlatform,
      profile,
      category,
      priority: priority || "medium",
      fixedAmount: category === "fixed" ? (parseFloat(fixedAmount) || 0) : 0,
      paymentSchedule: paymentSchedule || "upfront",
      scopePolicy,
      hourlyRate: category === "hourly" ? (parseFloat(hourlyRate) || 0) : 0,
      estimatedHours: parseFloat(estimatedHours) || 0,
      milestones: milestones || [],
      totalAmount: initialTotalAmount,
      paidAmount: initialPaidAmount,
      pendingAmount: initialPendingAmount,
      visibleToTeamLeads,
      createdBy: req.user._id,
    });

    res.status(201).json({ 
      success: true, 
      message: "Project created successfully",
      project 
    });
  } catch (error) {
    console.error("Add project error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error creating project", 
      error: error.message 
    });
  }
};

/**
 * @desc Get all projects (role-based filtering)
 * @route GET /api/projects
 * @access Private (Admin/TeamLead)
 */
export const getAllProjects = async (req, res) => {
  try {
    let query = {};
    let selectFields = "";

    // Role-based filtering and field selection
    if (req.user.role === "teamlead") {
      query.teamLead = req.user._id;
      // Hide financial data from team leads
      selectFields = "-paidAmount -pendingAmount -totalAmount -fixedAmount -hourlyRate -payments";
    }

    const projects = await Project.find(query)
      .populate("teamLead", "name email")
      .populate("employees", "name email")
      .populate("createdBy", "name email")
      .select(selectFields)
      .sort({ createdAt: -1 });

    let projectDetails = [];
    if (req.user.role === "admin") {
      projectDetails = await ProjectDetails.find().populate("project");
    }

    res.status(200).json({ 
      success: true, 
      projects, 
      projectDetails: req.user.role === "admin" ? projectDetails : undefined,
      count: projects.length 
    });
  } catch (error) {
    console.error("Get all projects error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching projects", 
      error: error.message 
    });
  }
};

/**
 * @desc Get single project by ID (role-based filtering)
 * @route GET /api/projects/:id
 * @access Private (Admin/TeamLead)
 */
export const getProjectById = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    let selectFields = "";

    // Role-based access control
    if (req.user.role === "teamlead") {
      query.teamLead = req.user._id;
      selectFields = "-paidAmount -pendingAmount -totalAmount -fixedAmount -hourlyRate -payments";
    }

    const project = await Project.findOne(query)
      .populate("teamLead", "name email")
      .populate("employees", "name email")
      .populate("createdBy", "name email")
      .select(selectFields);

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found or access denied" 
      });
    }

    let projectDetails = null;
    if (req.user.role === "admin") {
      projectDetails = await ProjectDetails.findOne({ project: req.params.id });
    }

    res.status(200).json({ 
      success: true, 
      project, 
      projectDetails 
    });
  } catch (error) {
    console.error("Get project by ID error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching project", 
      error: error.message 
    });
  }
};

/**
 * @desc Update a project
 * @route PUT /api/projects/:id
 * @access Private (Admin)
 */
export const updateProject = async (req, res) => {
  try {
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updatedBy: req.user._id }, 
      {
        new: true,
        runValidators: true,
      }
    ).populate("teamLead", "name email")
     .populate("employees", "name email");

    if (!updatedProject) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Project updated successfully",
      project: updatedProject 
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating project", 
      error: error.message 
    });
  }
};

/**
 * @desc Delete a project
 * @route DELETE /api/projects/:id
 * @access Private (Admin)
 */
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    // Also delete associated project details and tasks
    await ProjectDetails.deleteOne({ project: req.params.id });
    await Task.deleteMany({ project: req.params.id });

    res.status(200).json({ 
      success: true, 
      message: "Project deleted successfully" 
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting project", 
      error: error.message 
    });
  }
};

/* ------------------- PROJECT DETAILS CRUD ------------------- */

/**
 * @desc Add Project Details
 * @route POST /api/projects/:projectId/details
 * @access Private (Admin)
 */
export const addProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { description, totalPrice, profile, projectPlatform, onBoardDate } = req.body;

    if (!description) {
      return res.status(400).json({ 
        success: false, 
        message: "Description is required" 
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    // Check if project details already exist
    let projectDetails = await ProjectDetails.findOne({ project: projectId });
    
    if (projectDetails) {
      return res.status(400).json({ 
        success: false, 
        message: "Project details already exist. Use update instead." 
      });
    }

    projectDetails = await ProjectDetails.create({
      project: projectId,
      description,
      totalPrice: totalPrice ? parseFloat(totalPrice) : undefined,
      profile,
      projectPlatform,
      onBoardDate: onBoardDate ? new Date(onBoardDate) : undefined
    });

    res.status(201).json({ 
      success: true, 
      message: "Project details added successfully",
      projectDetails 
    });
  } catch (error) {
    console.error("Add project details error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error adding project details", 
      error: error.message 
    });
  }
};

/**
 * @desc Get Project Details
 * @route GET /api/projects/:projectId/details
 * @access Private (Admin/TeamLead)
 */
export const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if teamlead has access to this project
    if (req.user.role === "teamlead") {
      const project = await Project.findOne({ _id: projectId, teamLead: req.user._id });
      if (!project) {
        return res.status(403).json({ 
          success: false, 
          message: "Access denied to this project" 
        });
      }
    }

    const projectDetails = await ProjectDetails.findOne({ project: projectId })
      .populate("project", "projectName clientName");

    if (!projectDetails) {
      return res.status(404).json({ 
        success: false, 
        message: "Project details not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      projectDetails 
    });
  } catch (error) {
    console.error("Get project details error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching project details", 
      error: error.message 
    });
  }
};

/**
 * @desc Update Project Details
 * @route PUT /api/projects/details/:detailId
 * @access Private (Admin)
 */
export const updateProjectDetails = async (req, res) => {
  try {
    const { detailId } = req.params;

    const updatedDetails = await ProjectDetails.findByIdAndUpdate(
      detailId, 
      req.body, 
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedDetails) {
      return res.status(404).json({ 
        success: false, 
        message: "Project details not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Project details updated successfully",
      projectDetails: updatedDetails 
    });
  } catch (error) {
    console.error("Update project details error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating project details", 
      error: error.message 
    });
  }
};

/**
 * @desc Delete Project Details
 * @route DELETE /api/projects/details/:detailId
 * @access Private (Admin)
 */
export const deleteProjectDetails = async (req, res) => {
  try {
    const { detailId } = req.params;

    const details = await ProjectDetails.findByIdAndDelete(detailId);
    
    if (!details) {
      return res.status(404).json({ 
        success: false, 
        message: "Project details not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Project details deleted successfully" 
    });
  } catch (error) {
    console.error("Delete project details error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting project details", 
      error: error.message 
    });
  }
};

/* ------------------- PROJECT GROUP CRUD ------------------- */

/**
 * @desc Create Project Group  
 * @route POST /api/projects/groups
 * @access Private (Admin)
 */
export const addProjectGroup = async (req, res) => {
  try {
    const { groupId, mainProject, projects, pricingModel, totalValue, clientName } = req.body;

    if (!groupId || !mainProject || !clientName) {
      return res.status(400).json({ 
        success: false, 
        message: "Group ID, main project, and client name are required" 
      });
    }

    // Check if group ID already exists
    const existingGroup = await ProjectGroup.findOne({ groupId });
    if (existingGroup) {
      return res.status(400).json({ 
        success: false, 
        message: "Group ID already exists" 
      });
    }

    const group = await ProjectGroup.create({
      groupId,
      mainProject,
      projects: projects || [],
      pricingModel: pricingModel || "fixed",
      totalValue: totalValue ? parseFloat(totalValue) : 0,
      clientName,
      createdBy: req.user._id,
    });

    const populatedGroup = await ProjectGroup.findById(group._id)
      .populate("mainProject", "projectName clientName")
      .populate("projects", "projectName clientName")
      .populate("createdBy", "name email");

    res.status(201).json({ 
      success: true, 
      message: "Project group created successfully",
      group: populatedGroup 
    });
  } catch (error) {
    console.error("Add project group error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error creating project group", 
      error: error.message 
    });
  }
};

/**
 * @desc Get all Project Groups
 * @route GET /api/projects/groups
 * @access Private (Admin/TeamLead)
 */
export const getAllProjectGroups = async (req, res) => {
  try {
    let query = {};
    
    // If teamlead, only show groups containing their projects
    if (req.user.role === "teamlead") {
      const userProjects = await Project.find({ teamLead: req.user._id }).select('_id');
      const projectIds = userProjects.map(p => p._id);
      query = {
        $or: [
          { mainProject: { $in: projectIds } },
          { projects: { $in: projectIds } }
        ]
      };
    }

    const groups = await ProjectGroup.find(query)
      .populate("mainProject", "projectName clientName")
      .populate("projects", "projectName clientName")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      groups,
      count: groups.length 
    });
  } catch (error) {
    console.error("Get project groups error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching project groups", 
      error: error.message 
    });
  }
};

/**
 * @desc Update Project Group
 * @route PUT /api/projects/groups/:groupId
 * @access Private (Admin)
 */
export const updateProjectGroup = async (req, res) => {
  try {
    const updatedGroup = await ProjectGroup.findByIdAndUpdate(
      req.params.groupId, 
      req.body, 
      {
        new: true,
        runValidators: true,
      }
    ).populate("mainProject", "projectName clientName")
     .populate("projects", "projectName clientName")
     .populate("createdBy", "name email");

    if (!updatedGroup) {
      return res.status(404).json({ 
        success: false, 
        message: "Project group not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Project group updated successfully",
      group: updatedGroup 
    });
  } catch (error) {
    console.error("Update project group error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating project group", 
      error: error.message 
    });
  }
};

/**
 * @desc Delete Project Group
 * @route DELETE /api/projects/groups/:groupId
 * @access Private (Admin)
 */
export const deleteProjectGroup = async (req, res) => {
  try {
    const group = await ProjectGroup.findByIdAndDelete(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: "Project group not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Project group deleted successfully" 
    });
  } catch (error) {
    console.error("Delete project group error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting project group", 
      error: error.message 
    });
  }
};

/* ------------------- PAYMENTS ------------------- */

/**
 * @desc Add Payment with proper calculation
 * @route POST /api/projects/:projectId/payments
 * @access Private (Admin)
 */
export const addPayment = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { amount, paymentMethod = "bank-transfer", notes, milestoneId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid amount is required" 
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    // Calculate current totals before adding payment
    if (project.category === "hourly") {
      project.actualHours = project.timeEntries.reduce((total, entry) => total + (entry.hours || 0), 0);
      project.totalAmount = project.hourlyRate * project.actualHours;
    } else if (project.category === "milestone") {
      project.totalAmount = project.milestones.reduce((total, milestone) => total + (milestone.amount || 0), 0);
    } else if (project.category === "fixed") {
      project.totalAmount = project.fixedAmount || 0;
    }

    // Add payment
    project.payments.push({
      amount: parseFloat(amount),
      paymentMethod,
      notes,
      milestoneId,
      addedBy: req.user._id,
      paymentDate: new Date(),
    });

    // Recalculate paid and pending amounts
    project.paidAmount = project.payments.reduce((total, payment) => total + (payment.amount || 0), 0);
    project.pendingAmount = project.totalAmount - project.paidAmount;

    // Update milestone status if milestone payment
    if (milestoneId) {
      const milestone = project.milestones.id(milestoneId);
      if (milestone && parseFloat(amount) >= milestone.amount) {
        milestone.status = "completed";
      }
    }

    await project.save();

    res.status(200).json({ 
      success: true, 
      message: "Payment added successfully", 
      project
    });
  } catch (error) {
    console.error("Add payment error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error adding payment", 
      error: error.message 
    });
  }
};

/**
 * @desc Update Payment
 * @route PUT /api/projects/:projectId/payments/:paymentId
 * @access Private (Admin)
 */
export const updatePayment = async (req, res) => {
  try {
    const { projectId, paymentId } = req.params;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    const payment = project.payments.id(paymentId);
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: "Payment not found" 
      });
    }

    Object.assign(payment, req.body);
    
    // Recalculate paid amount
    project.paidAmount = project.payments.reduce((total, payment) => total + (payment.amount || 0), 0);
    project.pendingAmount = project.totalAmount - project.paidAmount;
    
    await project.save();

    res.status(200).json({ 
      success: true, 
      message: "Payment updated successfully",
      payment, 
      project 
    });
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating payment", 
      error: error.message 
    });
  }
};

/**
 * @desc Delete Payment
 * @route DELETE /api/projects/:projectId/payments/:paymentId
 * @access Private (Admin)
 */
export const deletePayment = async (req, res) => {
  try {
    const { projectId, paymentId } = req.params;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    const payment = project.payments.id(paymentId);
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: "Payment not found" 
      });
    }

    payment.deleteOne();
    
    // Recalculate amounts
    project.paidAmount = project.payments.reduce((total, payment) => total + (payment.amount || 0), 0);
    project.pendingAmount = project.totalAmount - project.paidAmount;
    
    await project.save();

    res.status(200).json({ 
      success: true, 
      message: "Payment deleted successfully", 
      project 
    });
  } catch (error) {
    console.error("Delete payment error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting payment", 
      error: error.message 
    });
  }
};

/**
 * @desc Add Milestone Payment
 * @route POST /api/projects/:projectId/milestones/:milestoneId/payments
 * @access Private (Admin)
 */
export const addMilestonePayment = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const { amount, paymentMethod, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: "Milestone not found" });

    project.payments.push({
      amount: parseFloat(amount),
      paymentMethod,
      notes,
      milestoneId,
      addedBy: req.user._id,
      paymentDate: new Date(),
    });

    if (parseFloat(amount) >= milestone.amount) milestone.status = "completed";

    // Recalculate amounts
    project.paidAmount = project.payments.reduce((total, payment) => total + (payment.amount || 0), 0);
    project.pendingAmount = project.totalAmount - project.paidAmount;

    await project.save();

    res.status(200).json({ success: true, message: "Milestone payment added", project });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error adding milestone payment", error: error.message });
  }
};

/* ------------------- TIME ENTRIES ------------------- */

/**
 * @desc Add Time Entry with proper calculation
 * @route POST /api/projects/:projectId/time-entries
 * @access Private (Admin/TeamLead)
 */
export const addTimeEntry = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { date, hours, description, taskType = "development" } = req.body;

    if (!hours || hours <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid hours are required" 
      });
    }

    if (!description) {
      return res.status(400).json({ 
        success: false, 
        message: "Description is required" 
      });
    }

    let query = { _id: projectId };
    
    // TeamLead can only add time entries to their projects
    if (req.user.role === "teamlead") {
      query.teamLead = req.user._id;
    }

    const project = await Project.findOne(query);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found or access denied" 
      });
    }

    if (project.category !== "hourly") {
      return res.status(400).json({ 
        success: false, 
        message: "Time entries can only be added to hourly projects" 
      });
    }

    // Add time entry
    project.timeEntries.push({
      date: date ? new Date(date) : new Date(),
      hours: parseFloat(hours),
      description,
      taskType,
      addedBy: req.user._id
    });

    // Recalculate totals for hourly projects
    project.actualHours = project.timeEntries.reduce((total, entry) => total + (entry.hours || 0), 0);
    if (req.user.role === "admin") {
      project.totalAmount = project.hourlyRate * project.actualHours;
      project.pendingAmount = project.totalAmount - project.paidAmount;
    }

    await project.save();

    // Remove financial data for teamlead response
    let responseProject = project.toObject();
    if (req.user.role === "teamlead") {
      delete responseProject.totalAmount;
      delete responseProject.paidAmount;
      delete responseProject.pendingAmount;
      delete responseProject.payments;
      delete responseProject.hourlyRate;
      delete responseProject.fixedAmount;
    }

    res.status(200).json({ 
      success: true, 
      message: "Time entry added successfully", 
      project: responseProject
    });
  } catch (error) {
    console.error("Add time entry error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error adding time entry", 
      error: error.message 
    });
  }
};

/**
 * @desc Update Time Entry
 * @route PUT /api/projects/:projectId/time-entries/:timeEntryId
 * @access Private (Admin/TeamLead)
 */
export const updateTimeEntry = async (req, res) => {
  try {
    const { projectId, timeEntryId } = req.params;
    
    let query = { _id: projectId };
    if (req.user.role === "teamlead") {
      query.teamLead = req.user._id;
    }

    const project = await Project.findOne(query);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found or access denied" 
      });
    }

    const timeEntry = project.timeEntries.id(timeEntryId);
    if (!timeEntry) {
      return res.status(404).json({ 
        success: false, 
        message: "Time entry not found" 
      });
    }

    Object.assign(timeEntry, req.body);
    
    // Recalculate totals for hourly projects
    if (project.category === "hourly") {
      project.actualHours = project.timeEntries.reduce((total, entry) => total + (entry.hours || 0), 0);
      if (req.user.role === "admin") {
        project.totalAmount = project.hourlyRate * project.actualHours;
        project.pendingAmount = project.totalAmount - project.paidAmount;
      }
    }
    
    await project.save();

    // Remove financial data for teamlead response
    let responseProject = project.toObject();
    if (req.user.role === "teamlead") {
      delete responseProject.totalAmount;
      delete responseProject.paidAmount;
      delete responseProject.pendingAmount;
      delete responseProject.payments;
      delete responseProject.hourlyRate;
      delete responseProject.fixedAmount;
    }

    res.status(200).json({ 
      success: true, 
      message: "Time entry updated successfully",
      timeEntry, 
      project: responseProject
    });
  } catch (error) {
    console.error("Update time entry error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating time entry", 
      error: error.message 
    });
  }
};

/**
 * @desc Delete Time Entry
 * @route DELETE /api/projects/:projectId/time-entries/:timeEntryId
 * @access Private (Admin/TeamLead)
 */
export const deleteTimeEntry = async (req, res) => {
  try {
    const { projectId, timeEntryId } = req.params;
    
    let query = { _id: projectId };
    if (req.user.role === "teamlead") {
      query.teamLead = req.user._id;
    }

    const project = await Project.findOne(query);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found or access denied" 
      });
    }

    const timeEntry = project.timeEntries.id(timeEntryId);
    if (!timeEntry) {
      return res.status(404).json({ 
        success: false, 
        message: "Time entry not found" 
      });
    }

    timeEntry.deleteOne();
    
    // Recalculate totals for hourly projects
    if (project.category === "hourly") {
      project.actualHours = project.timeEntries.reduce((total, entry) => total + (entry.hours || 0), 0);
      if (req.user.role === "admin") {
        project.totalAmount = project.hourlyRate * project.actualHours;
        project.pendingAmount = project.totalAmount - project.paidAmount;
      }
    }
    
    await project.save();

    // Remove financial data for teamlead response
    let responseProject = project.toObject();
    if (req.user.role === "teamlead") {
      delete responseProject.totalAmount;
      delete responseProject.paidAmount;
      delete responseProject.pendingAmount;
      delete responseProject.payments;
      delete responseProject.hourlyRate;
      delete responseProject.fixedAmount;
    }

    res.status(200).json({ 
      success: true, 
      message: "Time entry deleted successfully", 
      project: responseProject
    });
  } catch (error) {
    console.error("Delete time entry error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting time entry", 
      error: error.message 
    });
  }
};

/* ------------------- MILESTONES ------------------- */

/**
 * @desc Add Milestone with proper calculation
 * @route POST /api/projects/:projectId/milestones
 * @access Private (Admin)
 */
export const addMilestone = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, amount, dueDate, deliverables } = req.body;

    if (!title || !amount || !dueDate) {
      return res.status(400).json({ 
        success: false, 
        message: "Title, amount, and due date are required" 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Amount must be greater than 0" 
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    // Add milestone
    project.milestones.push({
      title,
      description,
      amount: parseFloat(amount),
      dueDate: new Date(dueDate),
      deliverables,
      order: project.milestones.length,
      status: "pending"
    });

    // Recalculate total for milestone projects
    if (project.category === "milestone") {
      project.totalAmount = project.milestones.reduce((total, milestone) => total + (milestone.amount || 0), 0);
      project.pendingAmount = project.totalAmount - project.paidAmount;
    }

    await project.save();

    res.status(201).json({ 
      success: true, 
      message: "Milestone added successfully", 
      project
    });
  } catch (error) {
    console.error("Add milestone error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error adding milestone", 
      error: error.message 
    });
  }
};

/**
 * @desc Update Milestone
 * @route PUT /api/projects/:projectId/milestones/:milestoneId
 * @access Private (Admin)
 */
export const updateMilestone = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ 
        success: false, 
        message: "Milestone not found" 
      });
    }

    Object.assign(milestone, req.body);
    
    // Recalculate totals for milestone projects
    if (project.category === "milestone") {
      project.totalAmount = project.milestones.reduce((total, milestone) => total + (milestone.amount || 0), 0);
      project.pendingAmount = project.totalAmount - project.paidAmount;
    }
    
    await project.save();

    res.status(200).json({ 
      success: true, 
      message: "Milestone updated successfully",
      milestone, 
      project 
    });
  } catch (error) {
    console.error("Update milestone error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating milestone", 
      error: error.message 
    });
  }
};

/**
 * @desc Delete Milestone
 * @route DELETE /api/projects/:projectId/milestones/:milestoneId
 * @access Private (Admin)
 */
export const deleteMilestone = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ 
        success: false, 
        message: "Milestone not found" 
      });
    }

    milestone.deleteOne();
    
    // Recalculate totals for milestone projects
    if (project.category === "milestone") {
      project.totalAmount = project.milestones.reduce((total, milestone) => total + (milestone.amount || 0), 0);
      project.pendingAmount = project.totalAmount - project.paidAmount;
    }
    
    await project.save();

    res.status(200).json({ 
      success: true, 
      message: "Milestone deleted successfully", 
      project 
    });
  } catch (error) {
    console.error("Delete milestone error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting milestone", 
      error: error.message 
    });
  }
};

/* ------------------- CLIENT STATUS ------------------- */

/**
 * @desc Update Client Status (accept / reject / review / away)
 * @route PATCH /api/projects/:projectId/client-status
 * @access Private (Admin/TeamLead)
 */
export const updateClientStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { clientStatus } = req.body;

    if (!["accept", "reject", "review", "away"].includes(clientStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid client status" 
      });
    }

    let query = { _id: projectId };
    if (req.user.role === "teamlead") {
      query.teamLead = req.user._id;
    }

    const project = await Project.findOneAndUpdate(
      query,
      { clientStatus },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found or access denied" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Client status updated successfully", 
      project 
    });
  } catch (error) {
    console.error("Update client status error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating client status", 
      error: error.message 
    });
  }
};

/* ------------------- TEAM MANAGEMENT ------------------- */

/**
 * @desc Assign Team Lead
 * @route PUT /api/projects/:projectId/teamlead
 * @access Private (Admin)
 */
export const assignTeamLead = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { teamLead } = req.body;

    if (!teamLead) {
      return res.status(400).json({ 
        success: false, 
        message: "Team Lead ID is required" 
      });
    }

    const project = await Project.findByIdAndUpdate(
      projectId,
      { teamLead },
      { new: true }
    ).populate("teamLead", "name email");

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Team Lead assigned successfully",
      project 
    });
  } catch (error) {
    console.error("Assign team lead error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error assigning team lead", 
      error: error.message 
    });
  }
};

/**
 * @desc Assign Employees
 * @route PUT /api/projects/:projectId/employees
 * @access Private (Admin)
 */
export const assignEmployees = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { employees } = req.body;

    if (!employees || !Array.isArray(employees)) {
      return res.status(400).json({ 
        success: false, 
        message: "Employee IDs array is required" 
      });
    }

    const project = await Project.findByIdAndUpdate(
      projectId,
      { employees },
      { new: true }
    ).populate("employees", "name email");

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Employees assigned successfully",
      project 
    });
  } catch (error) {
    console.error("Assign employees error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error assigning employees", 
      error: error.message 
    });
  }
};

/* ------------------- UTILITY FUNCTIONS ------------------- */

/**
 * @desc Recalculate project totals (utility function)
 * @route PUT /api/projects/:projectId/recalculate
 * @access Private (Admin)
 */
export const recalculateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    // Recalculate based on category
    if (project.category === "hourly") {
      project.actualHours = project.timeEntries.reduce((total, entry) => total + (entry.hours || 0), 0);
      project.totalAmount = project.hourlyRate * project.actualHours;
    } else if (project.category === "milestone") {
      project.totalAmount = project.milestones.reduce((total, milestone) => total + (milestone.amount || 0), 0);
    } else if (project.category === "fixed") {
      project.totalAmount = project.fixedAmount || 0;
    }

    // Recalculate payments
    project.paidAmount = project.payments.reduce((total, payment) => total + (payment.amount || 0), 0);
    project.pendingAmount = project.totalAmount - project.paidAmount;

    await project.save();

    res.status(200).json({
      success: true,
      message: "Project totals recalculated successfully",
      project: {
        totalAmount: project.totalAmount,
        paidAmount: project.paidAmount,
        pendingAmount: project.pendingAmount,
        actualHours: project.actualHours
      }
    });
  } catch (error) {
    console.error("Recalculate project error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error recalculating project", 
      error: error.message 
    });
  }
};

/* ------------------- ROLE-SPECIFIC FUNCTIONS ------------------- */

/**
 * @desc Get all projects available for teamleads to pick
 * @route GET /api/projects/available
 * @access Private (TeamLead)
 */
export const getAvailableProjects = async (req, res) => {
  try {
    const { status, priority, category, search } = req.query;

    // Build query for available projects
    let query = {
      visibleToTeamLeads: true,
      teamLead: null, // No team lead assigned yet
      status: { $in: ["pending", "active", "in-progress"] }
    };

    // Apply filters
    if (status && status !== "all") query.status = status;
    if (priority && priority !== "all") query.priority = priority;
    if (category && category !== "all") query.category = category;
    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: "i" } },
        { clientName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Only select safe fields for team leads
    const projects = await Project.find(query)
      .populate("createdBy", "name email")
      .select("projectName description deadline clientName status category priority createdBy createdAt updatedAt")
      .sort({ createdAt: -1, priority: 1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Get available projects error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching available projects",
      error: error.message,
    });
  }
};

/**
 * @desc Get projects assigned to the logged-in user
 * @route GET /api/projects/mine
 * @access Private (TeamLead/Employee)
 */
export const getMyProjects = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { status, priority, category } = req.query;

    let query = {};

    // Build query based on user role
    if (userRole === "teamlead") {
      query.teamLead = userId;
    } else if (userRole === "employee") {
      query.employees = userId;
    } else {
      return res.status(403).json({
        success: false,
        message: "Only team leads and employees can access this endpoint",
      });
    }

    // Add filters if provided
    if (status && status !== "all") {
      query.status = status;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    // Hide financial data from non-admin users
    const restrictedFields = "-paidAmount -pendingAmount -totalAmount -fixedAmount -hourlyRate -estimatedHours -budget -payments";

    const projects = await Project.find(query)
      .populate("teamLead", "name email role")
      .populate("employees", "name email role")
      .populate("createdBy", "name email")
      .select(restrictedFields)
      .sort({ updatedAt: -1 });

    // Calculate basic stats
    const stats = {
      total: projects.length,
      pending: projects.filter((p) => p.status === "pending").length,
      inProgress: projects.filter((p) => p.status === "in-progress").length,
      completed: projects.filter((p) => p.status === "completed").length,
      onHold: projects.filter((p) => p.status === "on-hold").length,
    };

    res.status(200).json({
      success: true,
      count: projects.length,
      stats,
      projects,
    });
  } catch (error) {
    console.error("Get my projects error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching your projects",
      error: error.message,
    });
  }
};

/**
 * @desc Get projects assigned to the logged-in employee by their teamlead
 * @route GET /api/projects/assigned
 * @access Private (Employee)
 */
/**
 * @desc Get projects assigned to the logged-in employee by their teamlead
 * @route GET /api/projects/assigned
 * @access Private (Employee)
 */
export const getAssignedProjects = async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ 
        success: false, 
        message: "Only employees can access assigned projects" 
      });
    }

    // Find projects where the logged-in employee is assigned
    const projects = await Project.find({ employees: req.user._id })
      .populate("teamLead", "name email role")
      .populate("employees", "name email role")
      .populate("createdBy", "name email role")
      .select("-paidAmount -pendingAmount -totalAmount -fixedAmount -hourlyRate -payments") // Hide financial data
      .sort({ createdAt: -1 });

    // Get all tasks for these projects that are assigned to this employee
    const allTasks = await Task.find({ 
      project: { $in: projects.map(p => p._id) },
      assignedTo: req.user._id 
    })
      .populate("project", "projectName clientName deadline")
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    // Calculate statistics for the employee
    const stats = {
      totalProjects: projects.length,
      totalTasks: allTasks.length,
      tasksByStatus: {
        pending: allTasks.filter(t => t.status === 'pending').length,
        'in-progress': allTasks.filter(t => t.status === 'in-progress').length,
        review: allTasks.filter(t => t.status === 'review').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        blocked: allTasks.filter(t => t.status === 'blocked').length
      },
      projectsByStatus: {
        pending: projects.filter(p => p.status === 'pending').length,
        'in-progress': projects.filter(p => p.status === 'in-progress').length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        'on-hold': projects.filter(p => p.status === 'on-hold').length
      }
    };

    // For consistency with frontend expectations, return projects without embedded tasks
    // But provide the tasks separately
    const projectsPlain = projects.map(project => ({
      ...project.toObject(),
      taskCount: allTasks.filter(task => 
        task.project && task.project._id.toString() === project._id.toString()
      ).length,
      completedTasks: allTasks.filter(task => 
        task.project && 
        task.project._id.toString() === project._id.toString() && 
        task.status === 'completed'
      ).length
    }));

    res.status(200).json({
      success: true,
      count: projects.length,
      stats,
      projects: projectsPlain,  // Projects without embedded tasks
      tasks: allTasks,          // All tasks separately 
      message: projects.length === 0 ? "No assigned projects found" : undefined
    });
  } catch (error) {
    console.error("getAssignedProjects Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching assigned projects", 
      error: error.message 
    });
  }
};

/**
 * @desc Teamlead picks/claims a project
 * @route PUT /api/projects/:id/pick
 * @access Private (TeamLead)
 */
export const pickProject = async (req, res) => {
  try {
    const { id } = req.params;
    const teamLeadId = req.user._id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    // Find the project
    const project = await Project.findById(id)
      .populate("teamLead", "name email")
      .populate("createdBy", "name email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!project.visibleToTeamLeads) {
      return res.status(403).json({
        success: false,
        message: "This project is not available for team leads to pick",
      });
    }

    if (project.teamLead) {
      return res.status(400).json({
        success: false,
        message: `This project is already assigned to ${project.teamLead.name}`,
      });
    }

    const validStatuses = ["pending", "active", "in-progress"];
    if (!validStatuses.includes(project.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot pick projects with status: ${project.status}`,
      });
    }

    // Optional: enforce max concurrent projects per team lead
    const currentTeamLeadProjects = await Project.countDocuments({
      teamLead: teamLeadId,
      status: { $in: ["pending", "active", "in-progress"] },
    });

    const MAX_CONCURRENT_PROJECTS = 5;
    if (currentTeamLeadProjects >= MAX_CONCURRENT_PROJECTS) {
      return res.status(400).json({
        success: false,
        message: `You have reached the maximum limit of ${MAX_CONCURRENT_PROJECTS} concurrent projects`,
      });
    }

    // Assign team lead
    project.teamLead = teamLeadId;
    if (project.status === "pending") {
      project.status = "in-progress";
    }
    project.updatedBy = teamLeadId;

    await project.save();

    // Reload project with only safe fields
    const updatedProject = await Project.findById(id)
      .populate("teamLead", "name email role")
      .populate("employees", "name email role")
      .populate("createdBy", "name email role")
      .select("projectName description deadline clientName status category priority teamLead employees createdBy createdAt updatedAt");

    res.status(200).json({
      success: true,
      message: "Project picked successfully",
      project: updatedProject,
      teamLead: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error("Pick project error:", error);
    res.status(500).json({
      success: false,
      message: "Error picking project",
      error: error.message,
    });
  }
};

/**
 * @desc Release/Unassign a project (teamlead gives up project)
 * @route PUT /api/projects/:id/release
 * @access Private (TeamLead)
 */
export const releaseProject = async (req, res) => {
  try {
    const { id } = req.params;
    const teamLeadId = req.user._id;
    const { reason } = req.body;

    // Find the project
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Check if this teamlead owns the project
    if (!project.teamLead || project.teamLead.toString() !== teamLeadId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only release projects assigned to you"
      });
    }

    // Check if project can be released (not completed/cancelled)
    if (["completed", "cancelled"].includes(project.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot release completed or cancelled projects"
      });
    }

    // Release the project
    project.teamLead = null;
    project.status = "pending"; // Reset to pending for other teamleads to pick
    project.updatedBy = teamLeadId;

    // Clear assigned employees since teamlead is releasing
    project.employees = [];

    // Add a note about the release (if you have a notes/history field)
    if (reason) {
      console.log(`Project ${id} released by teamlead ${teamLeadId}. Reason: ${reason}`);
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: "Project released successfully. It's now available for other team leads to pick.",
      project: {
        id: project._id,
        projectName: project.projectName,
        status: project.status
      }
    });

  } catch (error) {
    console.error("Release project error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error releasing project", 
      error: error.message 
    });
  }
};

/* ------------------- TEAMLEAD DASHBOARD FUNCTIONS ------------------- */

/**
 * @desc Get projects with task details for teamlead (for Project Overview tab)
 * @route GET /api/projects/teamlead/overview
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
      .select("-paidAmount -pendingAmount -totalAmount -fixedAmount -hourlyRate -payments")
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
 * @route GET /api/projects/teamlead/team
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
 * @route GET /api/projects/teamlead/stats
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
 * @route GET /api/projects/teamlead/employees
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
 * @route GET /api/projects/teamlead/tasks
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
/**
 * @desc Get tasks assigned to the logged-in employee
 * @route GET /api/projects/employee/tasks
 * @access Private (Employee)
 */
export const getEmployeeTasks = async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ 
        success: false, 
        message: "Only employees can access this endpoint" 
      });
    }

    const { status, priority, project, search } = req.query;

    // Build query to find tasks assigned to this employee
    let query = { assignedTo: req.user._id };

    // Apply filters if provided
    if (status && status !== "all") {
      query.status = status;
    }
    if (priority && priority !== "all") {
      query.priority = priority;
    }
    if (project && project !== "all") {
      query.project = project;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const tasks = await Task.find(query)
      .populate("project", "projectName clientName deadline status")
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    // Calculate task statistics
    const taskStats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === "pending").length,
      inProgress: tasks.filter(t => t.status === "in-progress").length,
      review: tasks.filter(t => t.status === "review").length,
      completed: tasks.filter(t => t.status === "completed").length,
      blocked: tasks.filter(t => t.status === "blocked").length
    };

    res.status(200).json({
      success: true,
      count: tasks.length,
      stats: taskStats,
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

/**
 * @desc Get single task details for employee
 * @route GET /api/projects/employee/tasks/:taskId
 * @access Private (Employee)
 */
export const getEmployeeTaskById = async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ 
        success: false, 
        message: "Only employees can access this endpoint" 
      });
    }

    const { taskId } = req.params;

    const task = await Task.findOne({ 
      _id: taskId, 
      assignedTo: req.user._id 
    })
      .populate("project", "projectName clientName deadline status description")
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email")
      .populate("employeeResponses.createdBy", "name email")
      .populate("logs.updatedBy", "name email");

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
    console.error("Get employee task by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching task details",
      error: error.message
    });
  }
};

/**
 * @desc Update task status by employee
 * @route PATCH /api/projects/employee/tasks/:taskId/status
 * @access Private (Employee)
 */
export const updateEmployeeTaskStatus = async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ 
        success: false, 
        message: "Only employees can update task status" 
      });
    }

    const { taskId } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ["pending", "in-progress", "review", "completed", "blocked"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status. Valid statuses: " + validStatuses.join(", ") 
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

    // Update task status
    const previousStatus = task.status;
    task.status = status;

    // Add status change log
    task.logs.push({
      type: "status_change",
      description: `Status changed from "${previousStatus}" to "${status}"${notes ? `. Notes: ${notes}` : ""}`,
      updatedBy: req.user._id,
      timestamp: new Date(),
      metadata: {
        previousStatus,
        newStatus: status,
        notes: notes || null
      }
    });

    // If marked as completed, set completion details
    if (status === "completed") {
      task.completedBy = req.user._id;
      task.completedAt = new Date();
    }

    await task.save();

    // Return updated task with populated fields
    const updatedTask = await Task.findById(taskId)
      .populate("project", "projectName clientName")
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    res.status(200).json({
      success: true,
      message: `Task status updated to "${status}" successfully`,
      task: updatedTask
    });
  } catch (error) {
    console.error("Update employee task status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating task status",
      error: error.message
    });
  }
};

/**
 * @desc Add employee response to task
 * @route POST /api/projects/employee/tasks/:taskId/response
 * @access Private (Employee)
 */
export const addEmployeeTaskResponse = async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ 
        success: false, 
        message: "Only employees can add task responses" 
      });
    }

    const { taskId } = req.params;
    const { message, type = "progress" } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Response message is required" 
      });
    }

    // Validate response type
    const validTypes = ["progress", "question", "issue", "completion", "clarification"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid response type. Valid types: " + validTypes.join(", ") 
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

    // Add employee response
    task.employeeResponses.push({
      message: message.trim(),
      type,
      createdBy: req.user._id,
      createdAt: new Date()
    });

    // Add log entry for the response
    task.logs.push({
      type: "response_added",
      description: `Employee added a ${type} response`,
      updatedBy: req.user._id,
      timestamp: new Date(),
      metadata: {
        responseType: type,
        messageLength: message.trim().length
      }
    });

    await task.save();

    // Return updated task with populated fields
    const updatedTask = await Task.findById(taskId)
      .populate("project", "projectName clientName")
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("employeeResponses.createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Response added successfully",
      task: updatedTask
    });
  } catch (error) {
    console.error("Add employee task response error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding task response",
      error: error.message
    });
  }
};
/**
 * @desc Get project details for employee (only projects they're assigned to)
 * @route GET /api/projects/employee/project/:projectId
 * @access Private (Employee)
 */
export const getEmployeeProjectDetails = async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ 
        success: false, 
        message: "Only employees can access this endpoint" 
      });
    }

    const { projectId } = req.params;
    const employeeId = req.user._id;

    // Find project where employee is assigned
    const project = await Project.findOne({ 
      _id: projectId,
      employees: employeeId  // Employee must be assigned to this project
    })
      .populate("teamLead", "name email")
      .populate("employees", "name email role")
      .populate("createdBy", "name email")
      .select("-paidAmount -pendingAmount -totalAmount -fixedAmount -hourlyRate -payments"); // Hide financial data

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found or you're not assigned to this project" 
      });
    }

    // Get tasks assigned to this employee for this project
    const employeeTasks = await Task.find({ 
      project: projectId,
      assignedTo: employeeId 
    })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    // Get all project tasks (for context - what other team members are working on)
    const allProjectTasks = await Task.find({ project: projectId })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .select("title description status priority dueDate assignedTo createdBy") // Limited info for privacy
      .sort({ createdAt: -1 });

    // Calculate task statistics for this employee
    const myTaskStats = {
      total: employeeTasks.length,
      pending: employeeTasks.filter(t => t.status === 'pending').length,
      'in-progress': employeeTasks.filter(t => t.status === 'in-progress').length,
      review: employeeTasks.filter(t => t.status === 'review').length,
      completed: employeeTasks.filter(t => t.status === 'completed').length,
      blocked: employeeTasks.filter(t => t.status === 'blocked').length,
      overdue: employeeTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
      ).length
    };

    // Calculate overall project task statistics (for context)
    const projectTaskStats = {
      total: allProjectTasks.length,
      pending: allProjectTasks.filter(t => t.status === 'pending').length,
      'in-progress': allProjectTasks.filter(t => t.status === 'in-progress').length,
      review: allProjectTasks.filter(t => t.status === 'review').length,
      completed: allProjectTasks.filter(t => t.status === 'completed').length,
      blocked: allProjectTasks.filter(t => t.status === 'blocked').length
    };

    // Group other team tasks by team member (for collaboration awareness)
    const teamCollaboration = {};
    allProjectTasks
      .filter(task => task.assignedTo && task.assignedTo._id.toString() !== employeeId.toString())
      .forEach(task => {
        const memberId = task.assignedTo._id.toString();
        if (!teamCollaboration[memberId]) {
          teamCollaboration[memberId] = {
            member: task.assignedTo,
            taskCount: 0,
            recentTasks: []
          };
        }
        teamCollaboration[memberId].taskCount++;
        if (teamCollaboration[memberId].recentTasks.length < 3) {
          teamCollaboration[memberId].recentTasks.push({
            title: task.title,
            status: task.status,
            priority: task.priority
          });
        }
      });

    res.status(200).json({
      success: true,
      data: {
        project: {
          ...project.toObject(),
          // Add computed fields
          isAssigned: true,
          myRole: 'team member'
        },
        myTasks: employeeTasks,
        myTaskStats,
        projectOverview: {
          totalTasks: projectTaskStats.total,
          completionRate: projectTaskStats.total > 0 ? 
            Math.round((projectTaskStats.completed / projectTaskStats.total) * 100) : 0,
          teamSize: project.employees ? project.employees.length : 0
        },
        teamCollaboration: Object.values(teamCollaboration),
        permissions: {
          canViewFinancials: false,
          canEditProject: false,
          canAssignTasks: false,
          canViewTeamTasks: true, // Can see what others are working on for collaboration
          canUpdateOwnTasks: true
        }
      }
    });

  } catch (error) {
    console.error("Get employee project details error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project details",
      error: error.message
    });
  }
};

// ============================================
// PROJECT CONTROLLER - Additional Methods
// ============================================

/**
 * @desc Assign/Unassign employees to a project (Team Lead only)
 * @route PUT /api/projects/:projectId/assign-employees
 * @access Private (Team Lead)
 */
export const assignEmployeesToProject = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({ 
        success: false, 
        message: "Only team leads can assign employees to projects" 
      });
    }

    const { projectId } = req.params;
    const { employeeIds } = req.body;
    const teamLeadId = req.user._id;

    // Validate input
    if (!Array.isArray(employeeIds)) {
      return res.status(400).json({
        success: false,
        message: "Employee IDs must be provided as an array"
      });
    }

    // Find the project and verify team lead ownership
    const project = await Project.findOne({ 
      _id: projectId, 
      teamLead: teamLeadId 
    });

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found or you're not the team lead for this project" 
      });
    }

    // Validate that all provided employee IDs exist and have employee role
    if (employeeIds.length > 0) {
      const validEmployees = await User.find({
        _id: { $in: employeeIds },
        role: 'employee'
      }).select('_id name firstName lastName email');

      const validEmployeeIds = validEmployees.map(emp => emp._id.toString());
      const invalidIds = employeeIds.filter(id => !validEmployeeIds.includes(id));

      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid or non-employee user IDs: ${invalidIds.join(', ')}`
        });
      }
    }

    // Update project with new employee assignments
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { 
        employees: employeeIds,
        updatedAt: new Date()
      },
      { new: true }
    )
      .populate("teamLead", "name email")
      .populate("employees", "name firstName lastName email role")
      .populate("createdBy", "name email");

    // Log the assignment change for audit purposes
    console.log(`Team Lead ${req.user.email} updated employee assignments for project ${project.projectName}:`, {
      previousCount: project.employees?.length || 0,
      newCount: employeeIds.length,
      assignedEmployees: employeeIds
    });

    // Create activity log (if you have an activity logging system)
    // await ActivityLog.create({
    //   user: req.user._id,
    //   action: 'assign_employees',
    //   resource: 'project',
    //   resourceId: projectId,
    //   details: {
    //     employeeCount: employeeIds.length,
    //     employeeIds: employeeIds
    //   }
    // });

    res.status(200).json({
      success: true,
      message: `Successfully updated team assignments for "${project.projectName}"`,
      project: updatedProject,
      assignedCount: employeeIds.length
    });

  } catch (error) {
    console.error("Assign employees to project error:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning employees to project",
      error: error.message
    });
  }
};

// ============================================
// USER CONTROLLER - Additional Methods
// ============================================

/**
 * @desc Get all employees for team lead assignment
 * @route GET /api/users/employees
 * @access Private (Team Lead)
 */
export const getAvailableEmployees = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({ 
        success: false, 
        message: "Only team leads can access employee list" 
      });
    }

    // Get all active employees
    const employees = await User.find({ 
      role: 'employee',
      isActive: { $ne: false } // Include users where isActive is true or undefined
    })
      .select('name firstName lastName email skills createdAt isActive')
      .sort({ firstName: 1, lastName: 1, name: 1 });

    // Get project assignment statistics for each employee
    const employeesWithStats = await Promise.all(
      employees.map(async (employee) => {
        const projectCount = await Project.countDocuments({
          employees: employee._id,
          status: { $in: ['pending', 'in-progress', 'active'] }
        });

        const completedProjectCount = await Project.countDocuments({
          employees: employee._id,
          status: 'completed'
        });

        return {
          _id: employee._id,
          name: employee.name,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          skills: employee.skills || [],
          isActive: employee.isActive !== false,
          stats: {
            activeProjects: projectCount,
            completedProjects: completedProjectCount,
            totalProjects: projectCount + completedProjectCount
          },
          createdAt: employee.createdAt
        };
      })
    );

    // Sort by active project count (least busy first) and then by name
    employeesWithStats.sort((a, b) => {
      if (a.stats.activeProjects !== b.stats.activeProjects) {
        return a.stats.activeProjects - b.stats.activeProjects;
      }
      const nameA = a.name || `${a.firstName} ${a.lastName}`.trim() || a.email;
      const nameB = b.name || `${b.firstName} ${b.lastName}`.trim() || b.email;
      return nameA.localeCompare(nameB);
    });

    res.status(200).json({
      success: true,
      employees: employeesWithStats,
      totalCount: employeesWithStats.length,
      availableCount: employeesWithStats.filter(emp => emp.stats.activeProjects < 3).length // Consider employees with < 3 active projects as "available"
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

// ============================================
// ROUTE DEFINITIONS TO ADD
// ============================================

// Add these routes to your project routes file (e.g., projectRoutes.js)
/*
// Team Lead - Assign employees to project
router.put('/:projectId/assign-employees', protect, assignEmployeesToProject);
*/

// Add these routes to your user routes file (e.g., userRoutes.js)
/*
// Team Lead - Get available employees
router.get('/employees', protect, getAvailableEmployees);

// Team Lead - Get employee workload summary
router.get('/employees/workload', protect, getEmployeeWorkloadSummary);
*/

// ============================================
// ENHANCED PROJECT CONTROLLER METHODS
// ============================================

/**
 * @desc Get projects for team lead with detailed employee info
 * @route GET /api/projects/mine
 * @access Private (Team Lead)
 */
export const getTeamLeadProjectsEnhanced = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({ 
        success: false, 
        message: "Only team leads can access this endpoint" 
      });
    }

    const teamLeadId = req.user._id;
    const { status, priority, category, search } = req.query;

    // Build query filters
    let query = { teamLead: teamLeadId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get projects with populated employee data
    const projects = await Project.find(query)
      .populate({
        path: "employees",
        select: "name firstName lastName email role skills isActive",
        options: { sort: { firstName: 1, lastName: 1, name: 1 } }
      })
      .populate("createdBy", "name firstName lastName email")
      .populate("teamLead", "name firstName lastName email")
      .sort({ createdAt: -1 });

    // Get task statistics for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskStats = await Task.aggregate([
          { $match: { project: project._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);

        const stats = {
          total: taskStats.reduce((sum, stat) => sum + stat.count, 0),
          pending: taskStats.find(s => s._id === 'pending')?.count || 0,
          'in-progress': taskStats.find(s => s._id === 'in-progress')?.count || 0,
          review: taskStats.find(s => s._id === 'review')?.count || 0,
          completed: taskStats.find(s => s._id === 'completed')?.count || 0,
          blocked: taskStats.find(s => s._id === 'blocked')?.count || 0
        };

        // Get employee task distribution
        const employeeTaskStats = await Task.aggregate([
          { $match: { project: project._id } },
          {
            $group: {
              _id: '$assignedTo',
              totalTasks: { $sum: 1 },
              completedTasks: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              inProgressTasks: {
                $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
              }
            }
          }
        ]);

        return {
          ...project.toObject(),
          taskStats: stats,
          employeeTaskStats,
          completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
        };
      })
    );

    // Calculate overall statistics
    const overallStats = {
      total: projects.length,
      pending: projects.filter(p => p.status === 'pending').length,
      'in-progress': projects.filter(p => p.status === 'in-progress').length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      'on-hold': projects.filter(p => p.status === 'on-hold').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length
    };

    res.status(200).json({
      success: true,
      projects: projectsWithStats,
      stats: overallStats,
      totalEmployeesManaged: [...new Set(projects.flatMap(p => p.employees?.map(e => e._id.toString()) || []))].length
    });

  } catch (error) {
    console.error("Get team lead projects enhanced error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching team lead projects",
      error: error.message
    });
  }
};

/**
 * @desc Remove employee from project (Team Lead only)
 * @route DELETE /api/projects/:projectId/employees/:employeeId
 * @access Private (Team Lead)
 */
export const removeEmployeeFromProject = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({ 
        success: false, 
        message: "Only team leads can remove employees from projects" 
      });
    }

    const { projectId, employeeId } = req.params;
    const teamLeadId = req.user._id;

    // Find the project and verify team lead ownership
    const project = await Project.findOne({ 
      _id: projectId, 
      teamLead: teamLeadId 
    });

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found or you're not the team lead for this project" 
      });
    }

    // Check if employee is assigned to the project
    if (!project.employees || !project.employees.includes(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Employee is not assigned to this project"
      });
    }

    // Get employee info before removal
    const employee = await User.findById(employeeId).select('name firstName lastName email');
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Remove employee from project
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { 
        $pull: { employees: employeeId },
        updatedAt: new Date()
      },
      { new: true }
    )
      .populate("employees", "name firstName lastName email role")
      .populate("teamLead", "name email")
      .populate("createdBy", "name email");

    // Also remove/reassign any tasks assigned to this employee for this project
    const tasksToUpdate = await Task.find({
      project: projectId,
      assignedTo: employeeId,
      status: { $nin: ['completed', 'cancelled'] }
    });

    if (tasksToUpdate.length > 0) {
      // Unassign the tasks (set assignedTo to null)
      await Task.updateMany(
        {
          project: projectId,
          assignedTo: employeeId,
          status: { $nin: ['completed', 'cancelled'] }
        },
        {
          $unset: { assignedTo: 1 },
          status: 'pending',
          updatedAt: new Date()
        }
      );
    }

    const employeeName = employee.name || 
      (employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.email);

    res.status(200).json({
      success: true,
      message: `Successfully removed ${employeeName} from "${project.projectName}"`,
      project: updatedProject,
      unassignedTasks: tasksToUpdate.length
    });

  } catch (error) {
    console.error("Remove employee from project error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing employee from project",
      error: error.message
    });
  }
};

/**
 * @desc Get project assignment history for team lead
 * @route GET /api/projects/:projectId/assignment-history
 * @access Private (Team Lead)
 */
export const getProjectAssignmentHistory = async (req, res) => {
  try {
    if (req.user.role !== "teamlead") {
      return res.status(403).json({ 
        success: false, 
        message: "Only team leads can view assignment history" 
      });
    }

    const { projectId } = req.params;
    const teamLeadId = req.user._id;

    // Verify project ownership
    const project = await Project.findOne({ 
      _id: projectId, 
      teamLead: teamLeadId 
    }).select('projectName clientName');

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found or you're not the team lead for this project" 
      });
    }

    // This would require implementing an assignment history tracking system
    // For now, return current assignment status with task distribution
    const currentEmployees = await Project.findById(projectId)
      .populate({
        path: "employees",
        select: "name firstName lastName email role createdAt"
      })
      .select('employees');

    const employeeTaskStats = await Task.aggregate([
      { $match: { project: mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: '$assignedTo',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          activeTasks: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'in-progress', 'review']] }, 1, 0] }
          }
        }
      }
    ]);

    const enrichedEmployees = currentEmployees?.employees?.map(emp => {
      const taskStats = employeeTaskStats.find(stat => 
        stat._id && stat._id.toString() === emp._id.toString()
      ) || { totalTasks: 0, completedTasks: 0, activeTasks: 0 };

      return {
        ...emp.toObject(),
        taskStats,
        performanceRate: taskStats.totalTasks > 0 ? 
          Math.round((taskStats.completedTasks / taskStats.totalTasks) * 100) : 0
      };
    }) || [];

    res.status(200).json({
      success: true,
      project: {
        id: project._id,
        name: project.projectName,
        client: project.clientName
      },
      currentAssignments: enrichedEmployees,
      totalAssigned: enrichedEmployees.length,
      // Note: Full assignment history would require additional schema and tracking
      note: "Full assignment history tracking requires additional implementation"
    });

  } catch (error) {
    console.error("Get project assignment history error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project assignment history",
      error: error.message
    });
  }
};