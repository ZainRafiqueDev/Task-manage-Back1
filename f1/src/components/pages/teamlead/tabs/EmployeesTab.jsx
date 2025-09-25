import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../services/api';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  User,
  FolderOpen,
  Target,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Activity,
  Award,
  Briefcase,
  Settings,
  TrendingUp,
  PieChart,
  BarChart3,
  Clock4,
  Users2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap
} from 'lucide-react';

const TeamTaskManagementTab = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Enhanced data states using project APIs
  const [employees, setEmployees] = useState([]);
  const [myTeam, setMyTeam] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // New states for project route data
  const [projectsWithTasks, setProjectsWithTasks] = useState([]);
  const [teamWithTasks, setTeamWithTasks] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [employeeTaskStatus, setEmployeeTaskStatus] = useState([]);
  const [taskAssignmentOverview, setTaskAssignmentOverview] = useState(null);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Task form states
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    specialInstructions: '',
    assignedTo: '',
    project: '',
    dueDate: '',
    priority: 'medium',
    projectLink: ''
  });

  // Enhanced fetch functions using project APIs
  const fetchDashboardStats = async () => {
    if (user.role === 'teamlead') {
      try {
        const response = await api.get('/projects/teamlead/stats');
        setDashboardStats(response.data.stats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    }
  };

  const fetchProjectsWithTasks = async () => {
    if (user.role === 'teamlead') {
      try {
        const response = await api.get('/projects/teamlead/overview');
        setProjectsWithTasks(response.data.projects || []);
      } catch (error) {
        console.error('Error fetching projects with tasks:', error);
      }
    }
  };

  const fetchTeamWithTasks = async () => {
    if (user.role === 'teamlead') {
      try {
        const response = await api.get('/projects/teamlead/team');
        setTeamWithTasks(response.data.teamMembers || []);
        
        // Also get task assignment overview to ensure we have all task data
        const taskOverviewResponse = await api.get('/projects/teamlead/tasks');
        setTaskAssignmentOverview(taskOverviewResponse.data);
        
        // Extract all tasks from the overview
        const allTasks = [
          ...(taskOverviewResponse.data.recentTasks || []),
          ...(taskOverviewResponse.data.unassignedTasks || [])
        ];
        
        // Add tasks from employee summaries
        if (taskOverviewResponse.data.employeeTaskSummary) {
          taskOverviewResponse.data.employeeTaskSummary.forEach(emp => {
            if (emp.tasks) {
              allTasks.push(...emp.tasks);
            }
          });
        }
        
        setTasks(allTasks);
        
      } catch (error) {
        console.error('Error fetching team with tasks:', error);
        // Fallback to basic team data
        try {
          const teamResponse = await api.get('/users/team/my-team');
          setTeamWithTasks(teamResponse.data.teamMembers || []);
        } catch (fallbackError) {
          console.error('Fallback team fetch failed:', fallbackError);
        }
      }
    }
  };

  const fetchEmployeeTaskStatus = async () => {
    if (user.role === 'teamlead') {
      try {
        const response = await api.get('/projects/teamlead/employees');
        setEmployeeTaskStatus(response.data.employees || []);
      } catch (error) {
        console.error('Error fetching employee task status:', error);
      }
    }
  };

  const fetchTaskAssignmentOverview = async () => {
    if (user.role === 'teamlead') {
      try {
        const response = await api.get('/projects/teamlead/tasks');
        setTaskAssignmentOverview(response.data);
      } catch (error) {
        console.error('Error fetching task assignment overview:', error);
      }
    }
  };

  // Keep existing fetch functions for backward compatibility
  const fetchEmployeesData = async () => {
    try {
      setError('');
      
      if (user.role === 'admin') {
        const response = await api.get('/users/employees');
        setEmployees(response.data.employees || []);
      } else if (user.role === 'teamlead') {
        try {
          const teamResponse = await api.get('/users/team/my-team');
          const myTeamData = teamResponse.data.teamMembers || [];
          setMyTeam(myTeamData);
          
          const availableResponse = await api.get('/users/employees/available');
          const availableData = availableResponse.data.employees || [];
          setAvailableEmployees(availableData);
          
          const allEmployeesResponse = await api.get('/users/employees');
          setEmployees(allEmployeesResponse.data.employees || []);
          
        } catch (teamError) {
          console.error('Error fetching team data:', teamError);
          const response = await api.get('/users/employees');
          setEmployees(response.data.employees || []);
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to fetch employees data');
    }
  };

  const fetchProjects = async () => {
    try {
      let response;
      if (user.role === 'admin') {
        response = await api.get('/projects/');
        setProjects(response.data.projects || []);
      } else if (user.role === 'teamlead') {
        response = await api.get('/projects/mine');
        const allProjects = response.data.projects || [];
        const myProjects = allProjects.filter(project => 
          project.teamLead && project.teamLead._id === user._id
        );
        setProjects(myProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects');
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Team management functions
  const assignToTeam = async (employeeIds) => {
    try {
      setActionLoading(true);
      setError('');
      
      const response = await api.post('/users/assign-team', {
        employeeIds: employeeIds
      });
      
      if (response.data.success) {
        setSuccess(`Successfully assigned ${employeeIds.length} employee(s) to team`);
        setSelectedEmployees([]);
        await Promise.all([
          fetchEmployeesData(),
          fetchTeamWithTasks(),
          fetchEmployeeTaskStatus(),
          fetchDashboardStats()
        ]);
      }
    } catch (error) {
      console.error('Error assigning team:', error);
      setError(error.response?.data?.message || 'Failed to assign team members');
    } finally {
      setActionLoading(false);
    }
  };

  const removeFromTeam = async (employeeIds) => {
    try {
      setActionLoading(true);
      setError('');
      
      const response = await api.post('/users/remove-team', {
        employeeIds: employeeIds
      });
      
      if (response.data.success) {
        setSuccess(`Successfully removed ${employeeIds.length} employee(s) from team`);
        setSelectedEmployees([]);
        await Promise.all([
          fetchEmployeesData(),
          fetchTeamWithTasks(),
          fetchEmployeeTaskStatus(),
          fetchDashboardStats()
        ]);
      }
    } catch (error) {
      console.error('Error removing from team:', error);
      setError(error.response?.data?.message || 'Failed to remove team members');
    } finally {
      setActionLoading(false);
    }
  };

  // Task management functions
  const createTask = async () => {
    try {
      setActionLoading(true);
      setError('');
      
      if (!taskForm.title || !taskForm.description || !taskForm.assignedTo) {
        setError('Title, description, and assigned employee are required');
        return;
      }

      let endpoint = '/tasks';
      if (user.role === 'teamlead') {
        endpoint = '/users/tasks/assign';
      }

      const response = await api.post(endpoint, {
        ...taskForm,
        dueDate: taskForm.dueDate || undefined
      });
      
      if (response.data.success) {
        setSuccess('Task created successfully');
        setShowTaskModal(false);
        setTaskForm({
          title: '',
          description: '',
          specialInstructions: '',
          assignedTo: '',
          project: '',
          dueDate: '',
          priority: 'medium',
          projectLink: ''
        });
        
        // Force refresh all data to ensure task counts update
        await Promise.all([
          fetchTasks(),
          fetchTeamWithTasks(),
          fetchEmployeeTaskStatus(),
          fetchTaskAssignmentOverview(),
          fetchProjectsWithTasks(),
          fetchEmployeesData()
        ]);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      setError(error.response?.data?.message || 'Failed to create task');
    } finally {
      setActionLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      setActionLoading(true);
      setError('');
      
      const response = await api.patch(`/users/tasks/${taskId}/status`, { status });
      
      if (response.data.success) {
        setSuccess('Task status updated successfully');
        
        // Update the local tasks array immediately for instant UI feedback
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task._id === taskId ? { ...task, status } : task
          )
        );
        
        // Then refresh all data to ensure consistency
        await Promise.all([
          fetchTasks(),
          fetchTeamWithTasks(),
          fetchEmployeeTaskStatus(),
          fetchTaskAssignmentOverview(),
          fetchProjectsWithTasks()
        ]);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      setError(error.response?.data?.message || 'Failed to update task status');
    } finally {
      setActionLoading(false);
    }
  };

  // Enhanced initial data fetch
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'teamlead')) {
      setLoading(true);
      const fetchPromises = [
        fetchEmployeesData(),
        fetchProjects(),
        fetchTasks()
      ];

      // Add teamlead-specific fetches
      if (user.role === 'teamlead') {
        fetchPromises.push(
          fetchDashboardStats(),
          fetchProjectsWithTasks(),
          fetchTeamWithTasks(),
          fetchEmployeeTaskStatus(),
          fetchTaskAssignmentOverview()
        );
      }

      Promise.all(fetchPromises).finally(() => setLoading(false));
    }
  }, [user]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Utility functions
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      review: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      blocked: 'bg-red-100 text-red-800 border-red-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      'on-hold': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Enhanced Dashboard View using project API data
  const DashboardView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Dashboard</h2>
          <p className="text-gray-600">Overview of team performance and project status</p>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Team Size */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Team Size</p>
                <p className="text-3xl font-bold">{dashboardStats.teamSize}</p>
                <p className="text-blue-100 text-sm">Active members</p>
              </div>
              <Users2 className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          {/* Projects */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Active Projects</p>
                <p className="text-3xl font-bold">{dashboardStats.projects?.total || 0}</p>
                <p className="text-purple-100 text-sm">
                  {dashboardStats.projects?.inProgress || 0} in progress
                </p>
              </div>
              <FolderOpen className="w-12 h-12 text-purple-200" />
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Tasks</p>
                <p className="text-3xl font-bold">{dashboardStats.tasks?.total || 0}</p>
                <p className="text-green-100 text-sm">
                  {dashboardStats.tasks?.completed || 0} completed
                </p>
              </div>
              <CheckSquare className="w-12 h-12 text-green-200" />
            </div>
          </div>

          {/* Available Employees */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Available</p>
                <p className="text-3xl font-bold">{dashboardStats.availableEmployees || 0}</p>
                <p className="text-orange-100 text-sm">Can be assigned</p>
              </div>
              <UserPlus className="w-12 h-12 text-orange-200" />
            </div>
          </div>
        </div>
      )}

      {/* Task Status Breakdown */}
      {taskAssignmentOverview && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(taskAssignmentOverview.overallStats.statusBreakdown).map(([status, count]) => (
              <div key={status} className="text-center p-4 rounded-lg bg-gray-50">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 ${getStatusColor(status)}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Projects with Tasks */}
      {projectsWithTasks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Projects & Tasks</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projectsWithTasks.slice(0, 4).map((project) => (
                <div key={project._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{project.projectName}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{project.clientName}</p>
                  
                  {project.taskStats && (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="font-semibold text-gray-900">{project.taskStats.total}</p>
                        <p className="text-gray-600 text-xs">Total</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="font-semibold text-blue-900">{project.taskStats.inProgress}</p>
                        <p className="text-blue-600 text-xs">Active</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="font-semibold text-green-900">{project.taskStats.completed}</p>
                        <p className="text-green-600 text-xs">Done</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
    const getEmployeeTasks = (employeeId) => {
    return tasks.filter(task => task.assignedTo?._id === employeeId);
  };
   const getTeamMemberTasks = () => {
    return tasks.filter(task => 
      myTeam.some(member => member._id === task.assignedTo?._id)
    );
  };



  // Enhanced Team Management View with better data integration
  // Enhanced Team Management View with improved UI matching the reference images
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'my-team') return matchesSearch && myTeam.some(m => m._id === employee._id);
    if (filterStatus === 'available') return matchesSearch && availableEmployees.some(m => m._id === employee._id);
    
    return matchesSearch;
  });

  if (!user || !['admin', 'teamlead'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Access denied. Admin or Team Lead role required.</p>
        </div>
      </div>
    );
  }
const TeamManagementView = () => (
    <div className="space-y-6">
      {/* Team Management Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Team Management</h2>
          <p className="text-gray-600">Manage team members and assignments</p>
        </div>
        
        <div className="flex gap-2">
          {selectedEmployees.length > 0 && (
            <div className="flex gap-2">
              {user.role === 'teamlead' && (
                <>
                  <button
                    onClick={() => assignToTeam(selectedEmployees)}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-md flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign to Team ({selectedEmployees.length})
                  </button>
                  <button
                    onClick={() => removeFromTeam(selectedEmployees)}
                    disabled={actionLoading}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-md flex items-center gap-2"
                  >
                    <UserMinus className="w-4 h-4" />
                    Remove from Team ({selectedEmployees.length})
                  </button>
                </>
              )}
            </div>
          )}
          
          <button
            onClick={() => setShowTaskModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Assign Task
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Employees</option>
            {user.role === 'teamlead' && (
              <>
                <option value="my-team">My Team</option>
                <option value="available">Available</option>
              </>
            )}
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <Filter className="w-4 h-4 mr-1" />
            {filteredEmployees.length} employees
          </div>
        </div>
      </div>

      {/* Team Stats */}
      {user.role === 'teamlead' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Team Size</p>
                <p className="text-2xl font-semibold text-gray-900">{myTeam.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <CheckSquare className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                <p className="text-2xl font-semibold text-gray-900">{getTeamMemberTasks().length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <FolderOpen className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Projects</p>
                <p className="text-2xl font-semibold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <UserPlus className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-semibold text-gray-900">{availableEmployees.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employees List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredEmployees.map((employee) => {
            const employeeTasks = getEmployeeTasks(employee._id);
            const isSelected = selectedEmployees.includes(employee._id);
            const isExpanded = expandedEmployee === employee._id;
            const isMyTeamMember = myTeam.some(m => m._id === employee._id);
            
            return (
              <div key={employee._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployees([...selectedEmployees, employee._id]);
                        } else {
                          setSelectedEmployees(selectedEmployees.filter(id => id !== employee._id));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    
                    <div className="ml-4 flex items-center">
                      <User className="w-10 h-10 text-gray-400 bg-gray-100 rounded-full p-2" />
                      <div className="ml-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                          {isMyTeamMember && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Team Member
                            </span>
                          )}
                          {employee.status === 'available' && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              Available
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{employee.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{employeeTasks.length}</p>
                      <p className="text-xs text-gray-600">Tasks</p>
                    </div>
                    
                    <button
                      onClick={() => setExpandedEmployee(isExpanded ? null : employee._id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                {isExpanded && employeeTasks.length > 0 && (
                  <div className="mt-4 ml-14 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Assigned Tasks:</h4>
                    {employeeTasks.map((task) => (
                      <div key={task._id} className="bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{task.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                            {task.project && (
                              <p className="text-xs text-blue-600 mt-1">
                                Project: {task.project.projectName}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            
                            <select
                              value={task.status}
                              onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                              className="ml-2 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="review">Review</option>
                              <option value="completed">Completed</option>
                              <option value="blocked">Blocked</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {filteredEmployees.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No employees found</p>
          </div>
        )}
      </div>
    </div>
  );



  // Enhanced Project Overview View
  const ProjectOverviewView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Project Overview</h2>
          <p className="text-gray-600">Detailed view of projects with tasks and team assignments</p>
        </div>
        {/* <div className="flex gap-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div> */}
      </div>

      <div className="grid gap-6">
        {projectsWithTasks.map((project) => {
          const isExpanded = expandedProject === project._id;
          
          return (
            <div key={project._id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {project.projectName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{project.projectName}</h3>
                      <p className="text-gray-600">{project.clientName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                    <button
                      onClick={() => setExpandedProject(isExpanded ? null : project._id)}
                      className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-white transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4">
                {project.taskStats && (
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{project.taskStats.total}</p>
                      <p className="text-xs text-gray-600">Total Tasks</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-700">{project.taskStats.pending}</p>
                      <p className="text-xs text-yellow-600">Pending</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-700">{project.taskStats.inProgress}</p>
                      <p className="text-xs text-blue-600">Active</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-700">{project.taskStats.review}</p>
                      <p className="text-xs text-purple-600">Review</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{project.taskStats.completed}</p>
                      <p className="text-xs text-green-600">Completed</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-700">{project.taskStats.blocked}</p>
                      <p className="text-xs text-red-600">Blocked</p>
                    </div>
                  </div>
                )}

                {project.deadline && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Calendar className="w-4 h-4" />
                    Deadline: {formatDate(project.deadline)}
                  </div>
                )}
              </div>

              {isExpanded && project.recentTasks && project.recentTasks.length > 0 && (
                <div className="px-6 pb-6 border-t bg-gray-50">
                  <div className="pt-4">
                    <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckSquare className="w-5 h-5" />
                      Project Tasks ({project.recentTasks.length})
                    </h4>
                    <div className="grid gap-3">
                      {project.recentTasks.map((task) => (
                        <div key={task._id} className="bg-white p-4 rounded-lg border shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 mb-1">{task.title}</h5>
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                              {task.assignedTo && (
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-700">Assigned to: {task.assignedTo.name}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                                {task.status}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {projectsWithTasks.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
          <p className="text-gray-600">Start by creating your first project or pick an available one.</p>
        </div>
      )}
    </div>
  );

  if (!user || !['admin', 'teamlead'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Access denied. Admin or Team Lead role required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team & Task Management</h1>
            <p className="text-gray-600">Comprehensive team and project oversight dashboard</p>
          </div>
          
          <button
            onClick={() => {
              setLoading(true);
              const fetchPromises = [
                fetchEmployeesData(),
                fetchProjects(),
                fetchTasks()
              ];

              if (user.role === 'teamlead') {
                fetchPromises.push(
                  fetchDashboardStats(),
                  fetchProjectsWithTasks(),
                  fetchTeamWithTasks(),
                  fetchEmployeeTaskStatus(),
                  fetchTaskAssignmentOverview()
                );
              }

              Promise.all(fetchPromises).finally(() => setLoading(false));
            }}
            disabled={loading || actionLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center shadow-sm">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center shadow-sm">
            <CheckSquare className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        {/* Enhanced Tabs */}
        <div className="bg-white rounded-lg border mb-6 p-1">
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('team-management')}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'team-management'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Team Management
            </button>
            <button
              onClick={() => setActiveTab('project-overview')}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'project-overview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Project Overview
            </button>
          </nav>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading team data...</p>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {!loading && (
          <>
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'team-management' && <TeamManagementView />}
            {activeTab === 'project-overview' && <ProjectOverviewView />}
          </>
        )}

        {/* Enhanced Task Assignment Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Plus className="w-6 h-6 text-blue-600" />
                  Assign New Task
                </h3>
                <p className="text-gray-600 mt-1">Create and assign a task to team members</p>
              </div>
              
              <div className="px-6 py-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title *</label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                      placeholder="Enter a clear, descriptive task title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Assign To *</label>
                    <select
                      value={taskForm.assignedTo}
                      onChange={(e) => setTaskForm({...taskForm, assignedTo: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    >
                      <option value="">Select Team Member</option>
                      {(user.role === 'teamlead' ? 
                        (teamWithTasks.length > 0 ? teamWithTasks : myTeam) : 
                        employees
                      ).map((employee) => (
                        <option key={employee._id} value={employee._id}>
                          {employee.name} - {employee.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Task Description *</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    placeholder="Provide detailed description of what needs to be accomplished"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Special Instructions</label>
                  <textarea
                    value={taskForm.specialInstructions}
                    onChange={(e) => setTaskForm({...taskForm, specialInstructions: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    placeholder="Any specific requirements, tools, or considerations"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Project</label>
                    <select
                      value={taskForm.project}
                      onChange={(e) => setTaskForm({...taskForm, project: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    >
                      <option value="">Select Project (Optional)</option>
                      {(projectsWithTasks.length > 0 ? projectsWithTasks : projects).map((project) => (
                        <option key={project._id} value={project._id}>
                          {project.projectName} - {project.clientName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    >
                      <option value="low">🟢 Low Priority</option>
                      <option value="medium">🟡 Medium Priority</option>
                      <option value="high">🟠 High Priority</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Project Link</label>
                  <input
                    type="url"
                    value={taskForm.projectLink}
                    onChange={(e) => setTaskForm({...taskForm, projectLink: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    placeholder="https://github.com/project-repo or relevant link"
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setTaskForm({
                      title: '',
                      description: '',
                      specialInstructions: '',
                      assignedTo: '',
                      project: '',
                      dueDate: '',
                      priority: 'medium',
                      projectLink: ''
                    });
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createTask}
                  disabled={actionLoading || !taskForm.title || !taskForm.description || !taskForm.assignedTo}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors shadow-sm"
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating Task...
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4" />
                      Create Task
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamTaskManagementTab;