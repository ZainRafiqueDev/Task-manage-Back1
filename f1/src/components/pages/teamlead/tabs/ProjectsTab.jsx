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
  Briefcase
} from 'lucide-react';

const TeamLeadProjectsTab = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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

  // Fetch my projects (projects I have picked)
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

  // Pick a project
 const pickProject = async (projectId) => {
  try {
    setActionLoading(true);
    setError('');

    const response = await api.put(`/projects/${projectId}/pick`);

    if (response.data.success) {
      // Refresh both lists after picking a project
      await Promise.all([fetchAvailableProjects(), fetchMyProjects()]);

      // Use the sanitized project from backend
      const projectName = response.data.project?.projectName || 'Project';
      alert(`✅ Successfully picked "${projectName}"`);
    } else {
      const message = response.data.message || 'Failed to pick project';
      setError(message);
      alert(`❌ ${message}`);
    }
  } catch (error) {
    console.error('Error picking project:', error);

    const errorMessage =
      error.response?.data?.message ||
      'Failed to pick project. Please try again.';
    setError(errorMessage);
    alert(`❌ ${errorMessage}`);
  } finally {
    setActionLoading(false);
  }
};


  // Release a project
  const releaseProject = async (projectId, projectName) => {
    const reason = prompt(`Are you sure you want to release "${projectName}"? This will make it available for other team leads.\n\nOptional: Enter a reason for releasing:`);
    
    if (reason === null) return; // User cancelled

    try {
      setActionLoading(true);
      setError('');
      
      const response = await api.put(`/projects/${projectId}/release`, { 
        reason: reason.trim() || undefined 
      });
      
      if (response.data.success) {
        // Refresh both lists
        await Promise.all([
          fetchAvailableProjects(),
          fetchMyProjects()
        ]);
        
        alert(`✅ ${response.data.message}`);
      } else {
        setError(response.data.message || 'Failed to release project');
        alert(`❌ ${response.data.message || 'Failed to release project'}`);
      }
    } catch (error) {
      console.error('Error releasing project:', error);
      const errorMessage = error.response?.data?.message || 'Failed to release project. Please try again.';
      setError(errorMessage);
      alert(`❌ ${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Initial data fetch and when filters change
  useEffect(() => {
    if (user && user.role === 'teamlead') {
      setLoading(true);
      Promise.all([
        fetchAvailableProjects(),
        fetchMyProjects()
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

  // Get creator name - handle different possible formats
  const getCreatorName = (createdBy) => {
    if (!createdBy) return 'Unknown';
    
    // Handle different possible formats from controller
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
          {/* Show who created the project */}
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

        {/* Show hourly rate for hourly projects */}
        {project.category === 'hourly' && project.hourlyRate && (
          <div className="flex items-center text-gray-600">
            <span className="text-green-600 font-medium">${project.hourlyRate}/hr</span>
          </div>
        )}

        {/* Show team lead info for my projects */}
        {isMyProject && (
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            <span>You are leading</span>
          </div>
        )}

        {/* Show employee count for my projects */}
        {isMyProject && project.employees && project.employees.length > 0 && (
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            <span>{project.employees.length} team member{project.employees.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {project.technologies && project.technologies.length > 0 && (
          <div className="col-span-2">
            <div className="flex flex-wrap gap-1 mt-2">
              {project.technologies.slice(0, 3).map((tech, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {tech}
                </span>
              ))}
              {project.technologies.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  +{project.technologies.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

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
              
              {/* Release Project Button - only show if project can be released */}
              {!['completed', 'cancelled'].includes(project.status) && (
                <button
                  onClick={() => releaseProject(project._id, project.projectName)}
                  disabled={actionLoading}
                  className="bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Release this project to make it available for other team leads"
                >
                  <XCircle className="w-3 h-3" />
                  {actionLoading ? 'Releasing...' : 'Release'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

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
          <p className="text-gray-600">Browse available projects and manage your assigned projects</p>
          {/* Show stats for my projects */}
          {activeTab === 'my-projects' && stats && (
            <div className="flex gap-4 mt-2 text-sm text-gray-600">
              <span>Total: {stats.total}</span>
              <span>In Progress: {stats.inProgress}</span>
              <span>Completed: {stats.completed}</span>
              {stats.onHold > 0 && <span>On Hold: {stats.onHold}</span>}
            </div>
          )}
        </div>
        
        <button
          onClick={() => {
            setLoading(true);
            Promise.all([
              fetchAvailableProjects(),
              fetchMyProjects()
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
        </nav>
      </div>

      {/* Filters */}
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading projects...</span>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeTab === 'available' ? (
            projects.length > 0 ? (
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
            )
          ) : (
            myProjects.length > 0 ? (
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
            )
          )}
        </div>
      )}
    </div>
  );
};

export default TeamLeadProjectsTab;