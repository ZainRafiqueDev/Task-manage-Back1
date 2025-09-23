import React, { useEffect, useState } from "react";
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectById,
  addPayment,
  updatePayment,
  deletePayment,
  addTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  updateClientStatus,
  assignTeamLead,
  assignEmployees,
  addProjectDetails,
  getProjectDetails,
  updateProjectDetails,
  deleteProjectDetails,
  addProjectGroup,
  getAllProjectGroups,
  updateProjectGroup,
  deleteProjectGroup,
  recalculateProject,
} from "../../../../services/ProjectApi";

const ProjectsTab = () => {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form States
  const [newProject, setNewProject] = useState({
    projectName: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    category: "fixed",
    description: "",
    deadline: "",
    fixedAmount: 0,
    hourlyRate: 0,
    estimatedHours: 0,
    priority: "medium",
    projectPlatform: "",
    profile: "",
  });

  // Management States
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "bank-transfer",
    notes: "",
    milestoneId: ""
  });

  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    description: "",
    amount: "",
    dueDate: "",
    deliverables: ""
  });

  const [timeForm, setTimeForm] = useState({
    hours: "",
    description: "",
    taskType: "development",
    date: new Date().toISOString().split('T')[0]
  });

  const [statusForm, setStatusForm] = useState({
    clientStatus: "review"
  });

  const [teamForm, setTeamForm] = useState({
    teamLead: "",
    employees: ""
  });

  const [detailsForm, setDetailsForm] = useState({
    description: "",
    totalPrice: "",
    profile: "",
    projectPlatform: "",
    onBoardDate: ""
  });

  const [groupForm, setGroupForm] = useState({
    groupId: "",
    mainProject: "",
    pricingModel: "fixed",
    totalValue: "",
    clientName: ""
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setSuccess("");
    } else {
      setSuccess(msg);
      setError("");
    }
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 5000);
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await getAllProjects();
      setProjects(data.projects || []);
      
      // Update active project if it exists
      if (activeProject) {
        const updatedActiveProject = data.projects?.find(p => p._id === activeProject._id);
        if (updatedActiveProject) {
          setActiveProject(updatedActiveProject);
        }
      }
    } catch (err) {
      console.error("Fetch Projects Error:", err);
      showMessage(`Error fetching projects: ${err.response?.data?.message || err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.projectName || !newProject.clientName || !newProject.category) {
      showMessage("Project name, client name, and category are required!", true);
      return;
    }

    // Validate based on category
    if (newProject.category === "fixed" && (!newProject.fixedAmount || newProject.fixedAmount <= 0)) {
      showMessage("Fixed amount is required for fixed projects!", true);
      return;
    }

    if (newProject.category === "hourly" && (!newProject.hourlyRate || newProject.hourlyRate <= 0)) {
      showMessage("Hourly rate is required for hourly projects!", true);
      return;
    }

    try {
      setLoading(true);
      const projectData = {
        ...newProject,
        fixedAmount: newProject.category === "fixed" ? parseFloat(newProject.fixedAmount) : 0,
        hourlyRate: newProject.category === "hourly" ? parseFloat(newProject.hourlyRate) : 0,
        estimatedHours: parseFloat(newProject.estimatedHours) || 0,
      };
      
      await createProject(projectData);
      
      // Reset form
      setNewProject({
        projectName: "",
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        category: "fixed",
        description: "",
        deadline: "",
        fixedAmount: 0,
        hourlyRate: 0,
        estimatedHours: 0,
        priority: "medium",
        projectPlatform: "",
        profile: "",
      });
      
      await fetchProjects();
      showMessage("Project created successfully!");
    } catch (err) {
      console.error("Create Project Error:", err);
      showMessage(`Error creating project: ${err.response?.data?.message || err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;

    try {
      setLoading(true);
      await deleteProject(id);
      await fetchProjects();
      
      if (activeProject && activeProject._id === id) {
        setActiveProject(null);
      }
      
      showMessage("Project deleted successfully!");
    } catch (err) {
      console.error("Delete Project Error:", err);
      showMessage(`Error deleting project: ${err.response?.data?.message || err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------- PROJECT MANAGEMENT FUNCTIONS ----------------- */

  const handleAddPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      showMessage("Valid amount is required!", true);
      return;
    }

    try {
      setLoading(true);
      const paymentData = {
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes,
        milestoneId: paymentForm.milestoneId || null
      };
      
      await addPayment(activeProject._id, paymentData);
      setPaymentForm({ amount: "", paymentMethod: "bank-transfer", notes: "", milestoneId: "" });
      await fetchProjects();
      showMessage("Payment added successfully!");
    } catch (err) {
      console.error("Add Payment Error:", err);
      showMessage(`Error adding payment: ${err.response?.data?.message || err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!milestoneForm.title || !milestoneForm.amount || !milestoneForm.dueDate) {
      showMessage("Title, amount, and due date are required!", true);
      return;
    }

    if (parseFloat(milestoneForm.amount) <= 0) {
      showMessage("Amount must be greater than 0!", true);
      return;
    }

    try {
      setLoading(true);
      const milestoneData = {
        title: milestoneForm.title.trim(),
        description: milestoneForm.description.trim(),
        amount: parseFloat(milestoneForm.amount),
        dueDate: milestoneForm.dueDate,
        deliverables: milestoneForm.deliverables.trim()
      };
      
      await addMilestone(activeProject._id, milestoneData);
      setMilestoneForm({ title: "", description: "", amount: "", dueDate: "", deliverables: "" });
      await fetchProjects();
      showMessage("Milestone added successfully!");
    } catch (err) {
      console.error("Add Milestone Error:", err);
      showMessage(`Error adding milestone: ${err.response?.data?.message || err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeEntry = async () => {
    if (!timeForm.hours || parseFloat(timeForm.hours) <= 0) {
      showMessage("Valid hours are required!", true);
      return;
    }

    if (!timeForm.description.trim()) {
      showMessage("Description is required!", true);
      return;
    }

    if (activeProject.category !== "hourly") {
      showMessage("Time entries can only be added to hourly projects!", true);
      return;
    }

    try {
      setLoading(true);
      const timeData = {
        hours: parseFloat(timeForm.hours),
        description: timeForm.description.trim(),
        taskType: timeForm.taskType,
        date: timeForm.date
      };
      
      await addTimeEntry(activeProject._id, timeData);
      setTimeForm({
        hours: "",
        description: "",
        taskType: "development",
        date: new Date().toISOString().split('T')[0]
      });
      await fetchProjects();
      showMessage("Time entry added successfully!");
    } catch (err) {
      console.error("Add Time Entry Error:", err);
      showMessage(`Error adding time entry: ${err.response?.data?.message || err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setLoading(true);
      await updateClientStatus(activeProject._id, statusForm.clientStatus);
      await fetchProjects();
      showMessage("Client status updated successfully!");
    } catch (err) {
      console.error("Update Status Error:", err);
      showMessage(`Error updating status: ${err.response?.data?.message || err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeamLead = async () => {
    if (!teamForm.teamLead.trim()) {
      showMessage("Team Lead ID is required!", true);
      return;
    }

    try {
      setLoading(true);
      await assignTeamLead(activeProject._id, teamForm.teamLead.trim());
      setTeamForm({ ...teamForm, teamLead: "" });
      await fetchProjects();
      showMessage("Team Lead assigned successfully!");
    } catch (err) {
      console.error("Assign Team Lead Error:", err);
      showMessage(`Error assigning team lead: ${err.response?.data?.message || err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignEmployees = async () => {
    if (!teamForm.employees.trim()) {
      showMessage("Employee IDs are required!", true);
      return;
    }

    try {
      setLoading(true);
      const employeeIds = teamForm.employees.split(",").map(e => e.trim()).filter(e => e);
      if (employeeIds.length === 0) {
        showMessage("Please provide valid employee IDs!", true);
        return;
      }
      
      await assignEmployees(activeProject._id, employeeIds);
      setTeamForm({ ...teamForm, employees: "" });
      await fetchProjects();
      showMessage("Employees assigned successfully!");
    } catch (err) {
      console.error("Assign Employees Error:", err);
      showMessage(`Error assigning employees: ${err.response?.data?.message || err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDetails = async () => {
    if (!detailsForm.description.trim()) {
      showMessage("Description is required!", true);
      return;
    }

    try {
      setLoading(true);
      const detailsData = {
        description: detailsForm.description.trim(),
        totalPrice: detailsForm.totalPrice ? parseFloat(detailsForm.totalPrice) : undefined,
        profile: detailsForm.profile.trim(),
        projectPlatform: detailsForm.projectPlatform.trim(),
        onBoardDate: detailsForm.onBoardDate || undefined
      };
      
      await addProjectDetails(activeProject._id, detailsData);
      setDetailsForm({ description: "", totalPrice: "", profile: "", projectPlatform: "", onBoardDate: "" });
      await fetchProjects();
      showMessage("Project details added successfully!");
    } catch (err) {
      console.error("Add Details Error:", err);
      showMessage(`Error adding details: ${err.response?.data?.message || err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupForm.groupId.trim() || !groupForm.clientName.trim()) {
      showMessage("Group ID and Client Name are required!", true);
      return;
    }

    try {
      setLoading(true);
      const groupData = {
        groupId: groupForm.groupId.trim(),
        mainProject: activeProject._id,
        pricingModel: groupForm.pricingModel,
        totalValue: groupForm.totalValue ? parseFloat(groupForm.totalValue) : 0,
        clientName: groupForm.clientName.trim()
      };
      
      await addProjectGroup(groupData);
      setGroupForm({ groupId: "", mainProject: "", pricingModel: "fixed", totalValue: "", clientName: "" });
      showMessage("Project group created successfully!");
    } catch (err) {
      console.error("Create Group Error:", err);
      showMessage(`Error creating group: ${err.response?.data?.message || err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateProject = async () => {
    if (!activeProject) return;

    try {
      setLoading(true);
      await recalculateProject(activeProject._id);
      await fetchProjects();
      showMessage("Project calculations updated successfully!");
    } catch (err) {
      console.error("Recalculate Project Error:", err);
      showMessage(`Error recalculating project: ${err.response?.data?.message || err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Project Management</h1>
          <p className="text-blue-600">Manage all your projects, payments, milestones, and team assignments</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}

        {/* Create Project Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Create New Project</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Project Name *"
              value={newProject.projectName}
              onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
              className="px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Client Name *"
              value={newProject.clientName}
              onChange={(e) => setNewProject({ ...newProject, clientName: e.target.value })}
              className="px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Client Email"
              value={newProject.clientEmail}
              onChange={(e) => setNewProject({ ...newProject, clientEmail: e.target.value })}
              className="px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="tel"
              placeholder="Client Phone"
              value={newProject.clientPhone}
              onChange={(e) => setNewProject({ ...newProject, clientPhone: e.target.value })}
              className="px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={newProject.category}
              onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
              className="px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fixed">Fixed Price</option>
              <option value="hourly">Hourly</option>
              <option value="milestone">Milestone</option>
            </select>
            <select
              value={newProject.priority}
              onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
              className="px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
            <input
              type="date"
              placeholder="Deadline"
              value={newProject.deadline}
              onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
              className="px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {newProject.category === "fixed" && (
              <input
                type="number"
                placeholder="Fixed Amount *"
                value={newProject.fixedAmount}
                onChange={(e) => setNewProject({ ...newProject, fixedAmount: parseFloat(e.target.value) || 0 })}
                className="px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            )}
            {newProject.category === "hourly" && (
              <>
                <input
                  type="number"
                  placeholder="Hourly Rate *"
                  value={newProject.hourlyRate}
                  onChange={(e) => setNewProject({ ...newProject, hourlyRate: parseFloat(e.target.value) || 0 })}
                  className="px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                <input
                  type="number"
                  placeholder="Estimated Hours"
                  value={newProject.estimatedHours}
                  onChange={(e) => setNewProject({ ...newProject, estimatedHours: parseFloat(e.target.value) || 0 })}
                  className="px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.5"
                />
              </>
            )}
            <input
              type="text"
              placeholder="Project Platform"
              value={newProject.projectPlatform}
              onChange={(e) => setNewProject({ ...newProject, projectPlatform: e.target.value })}
              className="px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Profile"
              value={newProject.profile}
              onChange={(e) => setNewProject({ ...newProject, profile: e.target.value })}
              className="px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              placeholder="Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent md:col-span-2 lg:col-span-3"
              rows={3}
            />
          </div>
          <button
            onClick={handleCreateProject}
            disabled={loading}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </div>
            ) : (
              "Create Project"
            )}
          </button>
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">
            All Projects ({projects.length})
          </h2>
          
          {loading && projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-blue-600">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No projects found. Create your first project above.</p>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className={`p-4 border-2 rounded-lg transition duration-200 cursor-pointer ${
                    activeProject?._id === project._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-blue-100 hover:border-blue-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-900">{project.projectName}</h3>
                      <p className="text-blue-600 mb-2">Client: {project.clientName}</p>
                      {project.clientEmail && (
                        <p className="text-sm text-gray-600 mb-2">Email: {project.clientEmail}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.category === 'fixed' ? 'bg-green-100 text-green-800' :
                          project.category === 'hourly' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.status === 'completed' ? 'bg-green-100 text-green-800' :
                          project.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                          project.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {project.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          project.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.priority}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <p><strong>Total:</strong> {formatCurrency(project.totalAmount)}</p>
                          <p><strong>Paid:</strong> {formatCurrency(project.paidAmount)}</p>
                        </div>
                        <div>
                          <p><strong>Pending:</strong> {formatCurrency(project.pendingAmount)}</p>
                          <p><strong>Team Lead:</strong> {project.teamLead?.name || "Not assigned"}</p>
                        </div>
                      </div>
                      {project.category === "hourly" && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p><strong>Hours:</strong> {project.actualHours || 0} / {project.estimatedHours || 0}</p>
                          <p><strong>Rate:</strong> {formatCurrency(project.hourlyRate)}/hr</p>
                        </div>
                      )}
                      <div className="mt-2 text-sm text-gray-600">
                        <p><strong>Employees:</strong> {project.employees?.length || 0}</p>
                        <p><strong>Milestones:</strong> {project.milestones?.length || 0}</p>
                        <p><strong>Payments:</strong> {project.payments?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => setActiveProject(activeProject?._id === project._id ? null : project)}
                        className={`px-4 py-2 rounded-lg font-medium transition duration-200 text-sm ${
                          activeProject?._id === project._id
                            ? "bg-blue-600 text-white"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        {activeProject?._id === project._id ? "Close" : "Manage"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project._id);
                        }}
                        className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg font-medium transition duration-200 text-sm disabled:opacity-50"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Project Management */}
        {activeProject && (
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-900">Managing: {activeProject.projectName}</h2>
              <button
                onClick={handleRecalculateProject}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition duration-200 disabled:opacity-50"
              >
                Recalculate
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Payments Section */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Add Payment</h3>
                  <div className="space-y-3">
                    <input
                      type="number"
                      placeholder="Amount *"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="bank-transfer">Bank Transfer</option>
                      <option value="credit-card">Credit Card</option>
                      <option value="paypal">PayPal</option>
                      <option value="stripe">Stripe</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                    {activeProject.milestones && activeProject.milestones.length > 0 && (
                      <select
                        value={paymentForm.milestoneId}
                        onChange={(e) => setPaymentForm({ ...paymentForm, milestoneId: e.target.value })}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Milestone (Optional)</option>
                        {activeProject.milestones.map((milestone, index) => (
                          <option key={milestone._id || index} value={milestone._id}>
                            {milestone.title} - {formatCurrency(milestone.amount)}
                          </option>
                        ))}
                      </select>
                    )}
                    <textarea
                      placeholder="Notes (optional)"
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                    <button
                      onClick={handleAddPayment}
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition duration-200 disabled:opacity-50"
                    >
                      {loading ? "Adding..." : "Add Payment"}
                    </button>
                  </div>
                </div>

                {/* Milestones Section */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="text-lg font-semibold text-orange-900 mb-4">Add Milestone</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Milestone Title *"
                      value={milestoneForm.title}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="number"
                      placeholder="Amount *"
                      value={milestoneForm.amount}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="0"
                      step="0.01"
                    />
                    <input
                      type="date"
                      placeholder="Due Date *"
                      value={milestoneForm.dueDate}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={milestoneForm.description}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={2}
                    />
                    <textarea
                      placeholder="Deliverables (optional)"
                      value={milestoneForm.deliverables}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, deliverables: e.target.value })}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={2}
                    />
                    <button
                      onClick={handleAddMilestone}
                      disabled={loading}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg transition duration-200 disabled:opacity-50"
                    >
                      {loading ? "Adding..." : "Add Milestone"}
                    </button>
                  </div>
                </div>

                {/* Time Entry Section - Only for Hourly Projects */}
                {activeProject.category === "hourly" && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4">Add Time Entry</h3>
                    <div className="space-y-3">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="Hours *"
                        value={timeForm.hours}
                        onChange={(e) => setTimeForm({ ...timeForm, hours: e.target.value })}
                        className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="0"
                      />
                      <input
                        type="date"
                        value={timeForm.date}
                        onChange={(e) => setTimeForm({ ...timeForm, date: e.target.value })}
                        className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <select
                        value={timeForm.taskType}
                        onChange={(e) => setTimeForm({ ...timeForm, taskType: e.target.value })}
                        className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="development">Development</option>
                        <option value="testing">Testing</option>
                        <option value="design">Design</option>
                        <option value="meeting">Meeting</option>
                        <option value="research">Research</option>
                        <option value="documentation">Documentation</option>
                        <option value="bug-fixing">Bug Fixing</option>
                        <option value="deployment">Deployment</option>
                      </select>
                      <textarea
                        placeholder="Description *"
                        value={timeForm.description}
                        onChange={(e) => setTimeForm({ ...timeForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={2}
                      />
                      <button
                        onClick={handleAddTimeEntry}
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition duration-200 disabled:opacity-50"
                      >
                        {loading ? "Adding..." : "Add Time Entry"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Client Status Section */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-4">Update Client Status</h3>
                  <div className="space-y-3">
                    <select
                      value={statusForm.clientStatus}
                      onChange={(e) => setStatusForm({ ...statusForm, clientStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-yellow-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="accept">Accept</option>
                      <option value="reject">Reject</option>
                      <option value="review">Review</option>
                      <option value="away">Away</option>
                    </select>
                    <button
                      onClick={handleUpdateStatus}
                      disabled={loading}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg transition duration-200 disabled:opacity-50"
                    >
                      {loading ? "Updating..." : "Update Status"}
                    </button>
                  </div>
                </div>

                {/* Team Management Section */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Team Management</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Team Lead User ID"
                      value={teamForm.teamLead}
                      onChange={(e) => setTeamForm({ ...teamForm, teamLead: e.target.value })}
                      className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={handleAssignTeamLead}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition duration-200 disabled:opacity-50"
                    >
                      {loading ? "Assigning..." : "Assign Team Lead"}
                    </button>
                    <input
                      type="text"
                      placeholder="Employee IDs (comma separated)"
                      value={teamForm.employees}
                      onChange={(e) => setTeamForm({ ...teamForm, employees: e.target.value })}
                      className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={handleAssignEmployees}
                      disabled={loading}
                      className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg transition duration-200 disabled:opacity-50"
                    >
                      {loading ? "Assigning..." : "Assign Employees"}
                    </button>
                  </div>
                </div>

                {/* Project Details Section */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-4">Add Project Details</h3>
                  <div className="space-y-3">
                    <textarea
                      placeholder="Description *"
                      value={detailsForm.description}
                      onChange={(e) => setDetailsForm({ ...detailsForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                    />
                    <input
                      type="number"
                      placeholder="Total Price"
                      value={detailsForm.totalPrice}
                      onChange={(e) => setDetailsForm({ ...detailsForm, totalPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="0"
                      step="0.01"
                    />
                    <input
                      type="text"
                      placeholder="Profile"
                      value={detailsForm.profile}
                      onChange={(e) => setDetailsForm({ ...detailsForm, profile: e.target.value })}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Project Platform"
                      value={detailsForm.projectPlatform}
                      onChange={(e) => setDetailsForm({ ...detailsForm, projectPlatform: e.target.value })}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="date"
                      placeholder="Onboard Date"
                      value={detailsForm.onBoardDate}
                      onChange={(e) => setDetailsForm({ ...detailsForm, onBoardDate: e.target.value })}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleAddDetails}
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition duration-200 disabled:opacity-50"
                    >
                      {loading ? "Adding..." : "Add Details"}
                    </button>
                  </div>
                </div>

                {/* Project Groups Section */}
                <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                  <h3 className="text-lg font-semibold text-teal-900 mb-4">Create Project Group</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Group ID *"
                      value={groupForm.groupId}
                      onChange={(e) => setGroupForm({ ...groupForm, groupId: e.target.value })}
                      className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="Client Name *"
                      value={groupForm.clientName}
                      onChange={(e) => setGroupForm({ ...groupForm, clientName: e.target.value })}
                      className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <select
                      value={groupForm.pricingModel}
                      onChange={(e) => setGroupForm({ ...groupForm, pricingModel: e.target.value })}
                      className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="hourly">Hourly</option>
                      <option value="milestone">Milestone</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Total Value"
                      value={groupForm.totalValue}
                      onChange={(e) => setGroupForm({ ...groupForm, totalValue: e.target.value })}
                      className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      min="0"
                      step="0.01"
                    />
                    <button
                      onClick={handleCreateGroup}
                      disabled={loading}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg transition duration-200 disabled:opacity-50"
                    >
                      {loading ? "Creating..." : "Create Group"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Information Display */}
            <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium text-gray-700 mb-2">Financial Summary</h4>
                  <p className="text-sm text-gray-600">Total Amount: {formatCurrency(activeProject.totalAmount)}</p>
                  <p className="text-sm text-gray-600">Paid Amount: {formatCurrency(activeProject.paidAmount)}</p>
                  <p className="text-sm text-gray-600">Pending: {formatCurrency(activeProject.pendingAmount)}</p>
                </div>
                {activeProject.category === "hourly" && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-medium text-gray-700 mb-2">Time Tracking</h4>
                    <p className="text-sm text-gray-600">Estimated Hours: {activeProject.estimatedHours || 0}</p>
                    <p className="text-sm text-gray-600">Actual Hours: {activeProject.actualHours || 0}</p>
                    <p className="text-sm text-gray-600">Hourly Rate: {formatCurrency(activeProject.hourlyRate)}</p>
                  </div>
                )}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium text-gray-700 mb-2">Progress</h4>
                  <p className="text-sm text-gray-600">Status: {activeProject.status}</p>
                  <p className="text-sm text-gray-600">Progress: {activeProject.progress || 0}%</p>
                  <p className="text-sm text-gray-600">Priority: {activeProject.priority}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium text-gray-700 mb-2">Team Info</h4>
                  <p className="text-sm text-gray-600">Team Lead: {activeProject.teamLead?.name || "Not assigned"}</p>
                  <p className="text-sm text-gray-600">Employees: {activeProject.employees?.length || 0}</p>
                  <p className="text-sm text-gray-600">Milestones: {activeProject.milestones?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {/* Recent Payments */}
                {activeProject.payments && activeProject.payments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Recent Payments ({activeProject.payments.length})</h4>
                    {activeProject.payments.slice(-3).reverse().map((payment, index) => (
                      <div key={payment._id || index} className="bg-white p-3 rounded border-l-4 border-green-500">
                        <p className="text-sm">
                          <span className="font-medium">{formatCurrency(payment.amount)}</span> via {payment.paymentMethod}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'No date'}
                          {payment.notes && ` - ${payment.notes}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent Time Entries */}
                {activeProject.timeEntries && activeProject.timeEntries.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Recent Time Entries ({activeProject.timeEntries.length})</h4>
                    {activeProject.timeEntries.slice(-3).reverse().map((entry, index) => (
                      <div key={entry._id || index} className="bg-white p-3 rounded border-l-4 border-purple-500">
                        <p className="text-sm">
                          <span className="font-medium">{entry.hours}h</span> - {entry.taskType}
                        </p>
                        <p className="text-xs text-gray-500">
                          {entry.date ? new Date(entry.date).toLocaleDateString() : 'No date'} - {entry.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Milestones */}
                {activeProject.milestones && activeProject.milestones.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Milestones ({activeProject.milestones.length})</h4>
                    {activeProject.milestones.map((milestone, index) => (
                      <div key={milestone._id || index} className="bg-white p-3 rounded border-l-4 border-orange-500">
                        <p className="text-sm">
                          <span className="font-medium">{milestone.title}</span> - {formatCurrency(milestone.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Status: {milestone.status || 'pending'} | Due: {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'No due date'}
                        </p>
                        {milestone.description && (
                          <p className="text-xs text-gray-500 mt-1">{milestone.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Show message if no activity */}
                {(!activeProject.payments || activeProject.payments.length === 0) &&
                 (!activeProject.timeEntries || activeProject.timeEntries.length === 0) &&
                 (!activeProject.milestones || activeProject.milestones.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No recent activity for this project</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsTab;