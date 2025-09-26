import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../services/api';
import { 
  FolderOpen, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye,
  UserPlus,
  Filter,
  Search,
  RefreshCw,
  XCircle,
  Users,
  Briefcase,
  UserMinus,
  Settings,
  Target,
  Plus,
  Trash2,
  Save
} from 'lucide-react';

const TeamLeadProjectsTab = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  
  // Enhanced employee states
  const [employees, setEmployees] = useState([]);
  const [myTeam, setMyTeam] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  // Team management states
  const [selectedProject, setSelectedProject] = useState(null);
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeFilterStatus, setEmployeeFilterStatus] = useState('all');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Enhanced fetch employees - uses the same logic as TeamTaskManagementTab
  const fetchEmployees = async () => {
    try {
      setError('');
      
      if (user.role === 'admin') {
        const response = await api.get('/users/employees');
        setEmployees(response.data.employees || []);
      } else if (user.role === 'teamlead') {
        const [teamResponse, availableResponse, allEmployeesResponse] = await Promise.allSettled([
          api.get('/users/team/my-team'),
          api.get('/users/employees/available'),
          api.get('/users/employees')
        ]);
        
        if (teamResponse.status === 'fulfilled' && teamResponse.value.data.success) {
          const myTeamData = teamResponse.value.data.teamMembers || [];
          setMyTeam(myTeamData);
          console.log('✅ My team loaded:', myTeamData.length, 'members');
        } else {
          setMyTeam([]);
        }
        
        if (availableResponse.status === 'fulfilled' && availableResponse.value.data.success) {
          setAvailableEmployees(availableResponse.value.data.employees || []);
          console.log('✅ Available employees loaded:', availableResponse.value.data.employees?.length);
        } else {
          setAvailableEmployees([]);
        }
        
        if (allEmployeesResponse.status === 'fulfilled' && allEmployeesResponse.value.data.success) {
          setEmployees(allEmployeesResponse.value.data.employees || []);
          console.log('✅ All employees loaded:', allEmployeesResponse.value.data.employees?.length);
        } else {
          setEmployees([]);
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError(`Failed to fetch employees: ${error.response?.data?.message || error.message}`);
    }
  };

  // Fetch available projects (created by admin, not yet picked by any team lead)
  const fetchAvailableProjects = async () => {
    try {
      setError('');
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      const response = await api.get(`/projects/available?${params}`);
      
      if (response.data.success) {
        setProjects(response.data.projects || []);
      } else {
        setProjects([]);
        setError(response.data.message || 'Failed to fetch available projects');
      }
    } catch (error) {
      console.error('Error fetching available projects:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch available projects';
      setError(errorMessage);
      setProjects([]);
    }
  };

  // Fetch my projects (projects I have picked) - Enhanced version
  const fetchMyProjects = async () => {
    try {
      setError('');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const response = await api.get(`/projects/mine?${params}`);
      
      if (response.data.success) {
        setMyProjects(response.data.projects || []);
        setStats(response.data.stats || null);
      } else {
        setMyProjects([]);
        setStats(null);
        setError(response.data.message || 'Failed to fetch your projects');
      }
    } catch (error) {
      console.error('Error fetching my projects:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch your projects';
      setError(errorMessage);
      setMyProjects([]);
      setStats(null);
    }
  };

  // Assign employees to project
  const assignEmployeesToProject = async (projectId, employeeIds) => {
    try {
      setActionLoading(true);
      const response = await api.put(`/projects/${projectId}/assign-employees`, {
        employeeIds: employeeIds
      });

      if (response.data.success) {
        await fetchMyProjects();
        setAssignmentModal(false);
        setSelectedProject(null);
        setSelectedEmployees([]);
        alert('Team members assigned successfully!');
      } else {
        alert('Failed to assign team members: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error assigning employees:', error);
      alert('Failed to assign team members: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Remove employee from project
  const removeEmployeeFromProject = async (projectId, employeeId, employeeName) => {
    if (!confirm(`Are you sure you want to remove ${employeeName} from this project?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.delete(`/projects/${projectId}/employees/${employeeId}`);

      if (response.data.success) {
        await fetchMyProjects();
        alert(`${employeeName} has been removed from the project.`);
      } else {
        alert('Failed to remove team member: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error removing employee:', error);
      alert('Failed to remove team member: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Pick a project
  const pickProject = async (projectId) => {
    try {
      setActionLoading(true);
      setError('');

      const response = await api.put(`/projects/${projectId}/pick`);

      if (response.data.success) {
        await Promise.all([fetchAvailableProjects(), fetchMyProjects()]);
        const projectName = response.data.project?.projectName || 'Project';
        alert(`Successfully picked "${projectName}"`);
      } else {
        const message = response.data.message || 'Failed to pick project';
        setError(message);
        alert(message);
      }
    } catch (error) {
      console.error('Error picking project:', error);
      const errorMessage = error.response?.data?.message || 'Failed to pick project. Please try again.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Release a project
  const releaseProject = async (projectId, projectName) => {
    const reason = prompt(`Are you sure you want to release "${projectName}"? This will make it available for other team leads.\n\nOptional: Enter a reason for releasing:`);
    
    if (reason === null) return;

    try {
      setActionLoading(true);
      setError('');
      
      const response = await api.put(`/projects/${projectId}/release`, { 
        reason: reason.trim() || undefined 
      });
      
      if (response.data.success) {
        await Promise.all([fetchAvailableProjects(), fetchMyProjects()]);
        alert(response.data.message);
      } else {
        setError(response.data.message || 'Failed to release project');
        alert(response.data.message || 'Failed to release project');
      }
    } catch (error) {
      console.error('Error releasing project:', error);
      const errorMessage = error.response?.data?.message || 'Failed to release project. Please try again.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Open assignment modal
  const openAssignmentModal = (project) => {
    setSelectedProject(project);
    setSelectedEmployees(project.employees?.map(emp => emp._id) || []);
    setAssignmentModal(true);
  };

  // Initial data fetch and when filters change
  useEffect(() => {
    if (user && user.role === 'teamlead') {
      setLoading(true);
      Promise.all([
        fetchAvailableProjects(),
        fetchMyProjects(),
        fetchEmployees()
      ]).finally(() => setLoading(false));
    }
  }, [user, debouncedSearchTerm, statusFilter, priorityFilter, categoryFilter]);

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      'on-hold': 'bg-orange-100 text-orange-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get creator name
  const getCreatorName = (createdBy) => {
    if (!createdBy) return 'Unknown';
    
    if (createdBy.firstName && createdBy.lastName) {
      return `${createdBy.firstName} ${createdBy.lastName}`;
    }
    if (createdBy.name) {
      return createdBy.name;
    }
    if (createdBy.email) {
      return createdBy.email;
    }
    
    return 'Unknown';
  };

  // Get employee name
  const getEmployeeName = (employee) => {
    if (!employee) return 'Unknown';
    
    if (employee.firstName && employee.lastName) {
      return `${employee.firstName} ${employee.lastName}`;
    }
    if (employee.name) {
      return employee.name;
    }
    if (employee.email) {
      return employee.email;
    }
    
    return 'Unknown';
  };

  const ProjectCard = ({ project, isMyProject = false }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {project.projectName}
          </h3>
          <p className="text-gray-600 flex items-center">
            <User className="w-4 h-4 mr-1" />
            {project.clientName}
          </p>
          {project.createdBy && (
            <p className="text-gray-500 text-xs flex items-center mt-1">
              <Briefcase className="w-3 h-3 mr-1" />
              Created by: {getCreatorName(project.createdBy)}
            </p>
          )}
        </div>
        
        <div className="flex flex-col gap-2 ml-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status.replace('-', ' ')}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
            {project.priority}
          </span>
        </div>
      </div>

      {project.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center text-gray-600">
          <Calendar className="w-4 h-4 mr-1" />
          <span>Due: {formatDate(project.deadline)}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <FolderOpen className="w-4 h-4 mr-1" />
          <span className="capitalize">{project.category}</span>
        </div>

        {project.estimatedHours && project.estimatedHours > 0 && (
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            <span>{project.estimatedHours}h estimated</span>
          </div>
        )}

        {isMyProject && (
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            <span>You are leading</span>
          </div>
        )}

        {isMyProject && project.employees && project.employees.length > 0 && (
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            <span>{project.employees.length} team member{project.employees.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Team Members Display for My Projects */}
      {isMyProject && project.employees && project.employees.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Team Members:</h4>
            <button
              onClick={() => openAssignmentModal(project)}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              <Settings className="w-3 h-3 inline mr-1" />
              Manage
            </button>
          </div>
          <div className="space-y-1">
            {project.employees.slice(0, 3).map(employee => (
              <div key={employee._id} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{getEmployeeName(employee)}</span>
                <button
                  onClick={() => removeEmployeeFromProject(project._id, employee._id, getEmployeeName(employee))}
                  className="text-red-500 hover:text-red-700 ml-2"
                  title="Remove from project"
                >
                  <UserMinus className="w-3 h-3" />
                </button>
              </div>
            ))}
            {project.employees.length > 3 && (
              <div className="text-xs text-gray-500">
                +{project.employees.length - 3} more members
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Created: {formatDate(project.createdAt)}
        </div>
        
        <div className="flex gap-2 items-center">
          {!isMyProject ? (
            <button
              onClick={() => pickProject(project._id)}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {actionLoading ? 'Picking...' : 'Pick Project'}
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <button className="bg-green-100 text-green-800 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                My Project
              </button>

              <button
                onClick={() => openAssignmentModal(project)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                title="Manage team members"
              >
                <Users className="w-3 h-3" />
                Team
              </button>
              
              {!['completed', 'cancelled'].includes(project.status) && (
                <button
                  onClick={() => releaseProject(project._id, project.projectName)}
                  disabled={actionLoading}
                  className="bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Release this project"
                >
                  <XCircle className="w-3 h-3" />
                  Release
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Team Management Component with enhanced filtering
  const TeamManagementTab = () => {
    const [teamSearchTerm, setTeamSearchTerm] = useState('');
    
    const filteredMyProjects = myProjects.filter(project =>
      project.projectName.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
      project.clientName.toLowerCase().includes(teamSearchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Team Management</h3>
            <p className="text-gray-600">Assign team members to your projects</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search your projects..."
              value={teamSearchTerm}
              onChange={(e) => setTeamSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {filteredMyProjects.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No projects to manage</p>
            <p className="text-gray-500 text-sm mt-2">
              Pick some projects first to start assigning team members
            </p>
            <button
              onClick={() => setActiveTab('available')}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Browse Available Projects
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredMyProjects.map((project) => (
              <div key={project._id} className="bg-white rounded-lg shadow border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{project.projectName}</h4>
                    <p className="text-gray-600">Client: {project.clientName}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                      <span className="text-sm text-gray-600">
                        {project.employees?.length || 0} team member{(project.employees?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => openAssignmentModal(project)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Manage Team
                  </button>
                </div>

                {project.employees && project.employees.length > 0 ? (
                  <div className="grid gap-3">
                    <h5 className="font-medium text-gray-700">Current Team Members:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {project.employees.map(employee => (
                        <div key={employee._id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {getEmployeeName(employee)}
                              </p>
                              <p className="text-xs text-gray-600">{employee.email}</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => removeEmployeeFromProject(project._id, employee._id, getEmployeeName(employee))}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remove from project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No team members assigned yet</p>
                    <button
                      onClick={() => openAssignmentModal(project)}
                      className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Assign Team Members
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Enhanced Assignment Modal with filtering
  const AssignmentModal = () => {
    if (!assignmentModal || !selectedProject) return null;

    // Get data source based on filter
    const getDataSource = () => {
      if (employeeFilterStatus === 'my-team') return myTeam;
      if (employeeFilterStatus === 'available') return availableEmployees;
      return employees;
    };

    const dataSource = getDataSource();

    // Apply search filter
    const filteredEmployees = dataSource.filter(employee => {
      const matchesSearch = (employee.name || '').toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                           (employee.email || '').toLowerCase().includes(employeeSearchTerm.toLowerCase());
      return matchesSearch;
    });

    const handleEmployeeToggle = (employeeId) => {
      setSelectedEmployees(prev =>
        prev.includes(employeeId)
          ? prev.filter(id => id !== employeeId)
          : [...prev, employeeId]
      );
    };

    const handleSaveAssignments = () => {
      assignEmployeesToProject(selectedProject._id, selectedEmployees);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Manage Team</h3>
                <p className="text-gray-600">{selectedProject.projectName}</p>
              </div>
              <button
                onClick={() => {
                  setAssignmentModal(false);
                  setSelectedProject(null);
                  setSelectedEmployees([]);
                  setEmployeeFilterStatus('all');
                  setEmployeeSearchTerm('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Filter and Search Controls */}
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Available Employees</h4>
                <p className="text-sm text-gray-600">
                  {selectedEmployees.length} selected
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={employeeFilterStatus}
                  onChange={(e) => setEmployeeFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Employees ({employees.length})</option>
                  <option value="my-team">My Team ({myTeam.length})</option>
                  <option value="available">Available ({availableEmployees.length})</option>
                </select>
              </div>

              <div className="text-sm text-gray-600 flex items-center">
                <Filter className="w-4 h-4 mr-1" />
                Showing {filteredEmployees.length} employees
              </div>
            </div>

            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">
                  {employeeFilterStatus === 'my-team' ? 'No team members found' :
                   employeeFilterStatus === 'available' ? 'No available employees found' :
                   'No employees found'}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {employeeSearchTerm ? 'Try adjusting your search term' : 
                   employeeFilterStatus !== 'all' ? 'Try changing the filter' : 
                   'No employees are registered in the system'}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {filteredEmployees.map(employee => {
                  const isMyTeamMember = myTeam.some(m => m._id === employee._id);
                  const isAvailable = availableEmployees.some(m => m._id === employee._id);
                  
                  return (
                    <div key={employee._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee._id)}
                          onChange={() => handleEmployeeToggle(employee._id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                        <User className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {getEmployeeName(employee)}
                            </p>
                            {isMyTeamMember && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">
                                My Team
                              </span>
                            )}
                            {isAvailable && !isMyTeamMember && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                                Available
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{employee.email}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {employee.stats?.activeProjects || 0} active project{(employee.stats?.activeProjects || 0) !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          {employee.stats?.totalProjects || 0} total
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setAssignmentModal(false);
                  setSelectedProject(null);
                  setSelectedEmployees([]);
                  setEmployeeFilterStatus('all');
                  setEmployeeSearchTerm('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAssignments}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!user || user.role !== 'teamlead') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Access denied. Team Lead role required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600">Browse available projects and manage your team</p>
          {activeTab === 'my-projects' && stats && (
            <div className="flex gap-4 mt-2 text-sm text-gray-600">
              <span>Total: {stats.total}</span>
              <span>In Progress: {stats.inProgress || 0}</span>
              <span>Completed: {stats.completed || 0}</span>
              {stats.onHold > 0 && <span>On Hold: {stats.onHold}</span>}
            </div>
          )}
        </div>
        
        <button
          onClick={() => {
            setLoading(true);
            Promise.all([
              fetchAvailableProjects(),
              fetchMyProjects(),
              fetchEmployees()
            ]).finally(() => setLoading(false));
          }}
          disabled={loading || actionLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('available')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'available'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Available Projects ({projects.length})
            <span className="text-xs text-gray-400 block">Ready to pick</span>
          </button>
          <button
            onClick={() => setActiveTab('my-projects')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'my-projects'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Projects ({myProjects.length})
            <span className="text-xs text-gray-400 block">Projects you're leading</span>
          </button>
          <button
            onClick={() => setActiveTab('team-management')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'team-management'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Team Management ({myProjects.length})
            <span className="text-xs text-gray-400 block">Assign team members</span>
          </button>
        </nav>
      </div>

      {/* Filters - Only show for available and my-projects tabs */}
      {activeTab !== 'team-management' && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="fixed">Fixed Price</option>
              <option value="hourly">Hourly</option>
              <option value="milestone">Milestone</option>
            </select>

            <div className="flex items-center text-sm text-gray-600">
              <Filter className="w-4 h-4 mr-1" />
              {activeTab === 'available' 
                ? `${projects.length} available` 
                : `${myProjects.length} my projects`
              }
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading projects...</span>
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <>
          {/* Available Projects Tab */}
          {activeTab === 'available' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {error ? "Error loading projects" : "No available projects to pick"}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Projects marked as visible to team leads will appear here
                  </p>
                  {error && (
                    <button
                      onClick={() => {
                        setError('');
                        fetchAvailableProjects();
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* My Projects Tab */}
          {activeTab === 'my-projects' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {myProjects.length > 0 ? (
                myProjects.map((project) => (
                  <ProjectCard key={project._id} project={project} isMyProject={true} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {error ? "Error loading projects" : "You haven't picked any projects yet"}
                  </p>
                  {!error && myProjects.length === 0 && (
                    <button
                      onClick={() => setActiveTab('available')}
                      className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Browse Available Projects
                    </button>
                  )}
                  {error && (
                    <button
                      onClick={() => {
                        setError('');
                        fetchMyProjects();
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Team Management Tab */}
          {activeTab === 'team-management' && <TeamManagementTab />}
        </>
      )}

      {/* Assignment Modal */}
      <AssignmentModal />
    </div>
  );
};


export default TeamLeadProjectsTab;