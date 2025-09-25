import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import { 
  CheckCircle, Clock, AlertTriangle, PlayCircle, PauseCircle, 
  MessageSquare, Plus, Calendar, Filter, Search, Eye, 
  ChevronDown, ChevronRight, Timer, Send, FolderOpen,
  Users, Target, User, Layers, BarChart3
} from 'lucide-react';

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'projects'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4" />
              <span>My Projects</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>My Tasks</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'projects' && <ProjectsTab />}
      {activeTab === 'tasks' && <TasksTab />}
    </div>
  );
};

// Overview Tab Component
const OverviewTab = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const [projectsRes, tasksRes] = await Promise.all([
        api.get('/projects/assigned'),
        api.get('/projects/employee/tasks')
      ]);
      setProjects(projectsRes.data.projects || []);
      setTasks(tasksRes.data.tasks || []);
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  // Group tasks by project
  const projectTaskGroups = projects.map(project => {
    const projectTasks = tasks.filter(task => 
      task.project && task.project._id === project._id
    );
    return { project, tasks: projectTasks };
  });

  const unassignedTasks = tasks.filter(task => !task.project);

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'review': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'blocked': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Work Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tasks.filter(t => t.status === 'in-progress').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Projects & Tasks</h3>
        
        {projectTaskGroups.map(({ project, tasks }) => (
          <div key={project._id} className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{project.projectName}</h4>
                  <p className="text-sm text-gray-600">Client: {project.clientName}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                    <span className="text-sm text-gray-600">{tasks.length} tasks</span>
                    {project.deadline && (
                      <span className="text-sm text-gray-600">
                        Due: {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No tasks assigned for this project</p>
              ) : (
                <div className="grid gap-4">
                  {tasks.slice(0, 5).map(task => (
                    <div key={task._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{task.title}</h5>
                        <p className="text-sm text-gray-600 line-clamp-1">{task.description}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-gray-500">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {tasks.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{tasks.length - 5} more tasks
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {unassignedTasks.length > 0 && (
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b bg-gray-50">
              <h4 className="text-lg font-semibold text-gray-900">Other Tasks</h4>
              <p className="text-sm text-gray-600">Tasks not associated with a specific project</p>
            </div>
            <div className="p-6">
              <div className="grid gap-4">
                {unassignedTasks.slice(0, 3).map(task => (
                  <div key={task._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{task.title}</h5>
                      <p className="text-sm text-gray-600 line-clamp-1">{task.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Projects Tab Component
const ProjectsTab = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

 const fetchData = async () => {
  try {
    setLoading(true);
    const [projectsRes, tasksRes] = await Promise.all([
      api.get('/projects/assigned'),
      api.get('/projects/employee/tasks') // CHANGE: was '/employee/tasks'
    ]);
    setProjects(projectsRes.data.projects || []);
    setTasks(tasksRes.data.tasks || []);
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    setLoading(false);
  }
};

  const fetchProjectDetails = async (projectId) => {
  try {
    // Use the new employee-specific endpoint
    const response = await api.get(`/projects/employee/project/${projectId}`);
    setSelectedProject(response.data.data);
  } catch (error) {
    console.error('Error fetching project details:', error);
    
    // Fallback to regular project endpoint if needed
    try {
      const fallbackResponse = await api.get(`/projects/${projectId}`);
      setSelectedProject(fallbackResponse.data.project);
    } catch (fallbackError) {
      console.error('Fallback failed:', fallbackError);
      alert('Unable to load project details. You may not have access to this project.');
    }
  }
};

  const getProjectTasks = (projectId) => {
    return tasks.filter(task => task.project && task.project._id === projectId);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'active': 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-gray-100 text-gray-800',
      'on-hold': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
        <div className="text-sm text-gray-600">
          {projects.length} project{projects.length !== 1 ? 's' : ''} assigned
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
        </select>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
          <p className="text-gray-600">You are not assigned to any projects matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => {
            const projectTasks = getProjectTasks(project._id);
            return (
              <ProjectCardWithTasks
                key={project._id}
                project={project}
                tasks={projectTasks}
                onViewDetails={fetchProjectDetails}
                getStatusColor={getStatusColor}
              />
            );
          })}
        </div>
      )}

      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          tasks={getProjectTasks(selectedProject._id)}
          onClose={() => setSelectedProject(null)}
          getStatusColor={getStatusColor}
        />
      )}
    </div>
  );
};

// Enhanced Tasks Tab Component
const TasksTab = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [groupByProject, setGroupByProject] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

const fetchData = async () => {
  try {
    setLoading(true);
    const [tasksRes, projectsRes] = await Promise.all([
      api.get('/projects/employee/tasks'), // CHANGE: was '/employee/tasks'
      api.get('/projects/assigned')
    ]);
    setTasks(tasksRes.data.tasks || []);
    setProjects(projectsRes.data.projects || []);
  } catch (error) {
    console.error('Error fetching tasks:', error);
  } finally {
    setLoading(false);
  }
};

  const fetchTaskDetails = async (taskId) => {
  try {
    const response = await api.get(`/projects/employee/tasks/${taskId}`); // CHANGE: was '/employee/tasks/${taskId}'
    setSelectedTask(response.data.task);
  } catch (error) {
    console.error('Error fetching task details:', error);
  }
};

const updateTaskStatus = async (taskId, status, notes = '') => {
  try {
    await api.patch(`/projects/employee/tasks/${taskId}/status`, { status, notes }); // CHANGE: was '/employee/tasks/${taskId}/status'
    fetchData();
    if (selectedTask && selectedTask._id === taskId) {
      fetchTaskDetails(taskId);
    }
  } catch (error) {
    console.error('Error updating task status:', error);
  }
};

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'review': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'blocked': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesProject = projectFilter === 'all' || 
                          (projectFilter === 'no-project' && !task.project) ||
                          (task.project && task.project._id === projectFilter);
    return matchesSearch && matchesStatus && matchesProject;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={groupByProject}
              onChange={(e) => setGroupByProject(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Group by Project</span>
          </label>
          <div className="text-sm text-gray-600">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="review">In Review</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
        </select>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Projects</option>
          <option value="no-project">No Project</option>
          {projects.map(project => (
            <option key={project._id} value={project._id}>
              {project.projectName}
            </option>
          ))}
        </select>
      </div>

      {/* Tasks Display */}
      {groupByProject ? (
        <TasksByProject 
          tasks={filteredTasks}
          projects={projects}
          onViewDetails={fetchTaskDetails}
          onStatusChange={updateTaskStatus}
          getStatusColor={getStatusColor}
        />
      ) : (
        <TasksList
          tasks={filteredTasks}
          onViewDetails={fetchTaskDetails}
          onStatusChange={updateTaskStatus}
          getStatusColor={getStatusColor}
        />
      )}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={updateTaskStatus}
          getStatusColor={getStatusColor}
        />
      )}
    </div>
  );
};

// Project Card with Tasks Component
const ProjectCardWithTasks = ({ project, tasks, onViewDetails, getStatusColor }) => {
  const [showTasks, setShowTasks] = useState(false);

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length
  };

  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.projectName}</h3>
            <p className="text-sm text-gray-600 mb-2">Client: {project.clientName}</p>
            <div className="flex items-center space-x-4">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              <span className="text-sm text-gray-600">
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              </span>
              {project.deadline && (
                <span className="text-sm text-gray-600">
                  Due: {new Date(project.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onViewDetails(project._id)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Details
          </button>
        </div>

        {tasks.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-green-600">{taskStats.completed} completed</span>
                <span className="text-blue-600">{taskStats.inProgress} in progress</span>
                <span className="text-yellow-600">{taskStats.pending} pending</span>
                {taskStats.blocked > 0 && (
                  <span className="text-red-600">{taskStats.blocked} blocked</span>
                )}
              </div>
              <button
                onClick={() => setShowTasks(!showTasks)}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
              >
                {showTasks ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span>{showTasks ? 'Hide' : 'Show'} Tasks</span>
              </button>
            </div>

            {showTasks && (
              <div className="space-y-2 pt-3 border-t">
                {tasks.slice(0, 5).map(task => (
                  <div key={task._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">{task.title}</h4>
                      <p className="text-xs text-gray-600 line-clamp-1">{task.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs text-gray-500">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {tasks.length > 5 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{tasks.length - 5} more tasks
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Tasks by Project Component
const TasksByProject = ({ tasks, projects, onViewDetails, onStatusChange, getStatusColor }) => {
  const projectGroups = projects.map(project => {
    const projectTasks = tasks.filter(task => task.project && task.project._id === project._id);
    return { project, tasks: projectTasks };
  }).filter(group => group.tasks.length > 0);

  const unassignedTasks = tasks.filter(task => !task.project);

  return (
    <div className="space-y-6">
      {projectGroups.map(({ project, tasks }) => (
        <div key={project._id} className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{project.projectName}</h3>
                <p className="text-sm text-gray-600">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {tasks.map(task => (
              <TaskCard
                key={task._id}
                task={task}
                onViewDetails={onViewDetails}
                onStatusChange={onStatusChange}
                getStatusColor={getStatusColor}
                showProject={false}
              />
            ))}
          </div>
        </div>
      ))}

      {unassignedTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-900">Other Tasks</h3>
            <p className="text-sm text-gray-600">{unassignedTasks.length} task{unassignedTasks.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="p-6 space-y-4">
            {unassignedTasks.map(task => (
              <TaskCard
                key={task._id}
                task={task}
                onViewDetails={onViewDetails}
                onStatusChange={onStatusChange}
                getStatusColor={getStatusColor}
                showProject={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Tasks List Component
const TasksList = ({ tasks, onViewDetails, onStatusChange, getStatusColor }) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Found</h3>
        <p className="text-gray-600">No tasks match your current search criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <TaskCard
          key={task._id}
          task={task}
          onViewDetails={onViewDetails}
          onStatusChange={onStatusChange}
          getStatusColor={getStatusColor}
          showProject={true}
        />
      ))}
    </div>
  );
};

// Enhanced Task Card Component
const TaskCard = ({ task, onViewDetails, onStatusChange, getStatusColor, showProject = true }) => {
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

  const handleQuickStatusChange = async (newStatus) => {
    await onStatusChange(task._id, newStatus);
    setShowStatusUpdate(false);
  };

  const isOverdue = (dueDate, status) => {
    return dueDate && new Date(dueDate) < new Date() && status !== 'completed';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
              {isOverdue(task.dueDate, task.status) && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{task.description}</p>
            
            {/* Project Association */}
            {showProject && (
              <div className="mb-2">
                {task.project ? (
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-600 text-sm font-medium">
                      {task.project.projectName}
                    </span>
                    <span className="text-gray-400 text-sm">•</span>
                    <span className="text-gray-600 text-sm">
                      {task.project.clientName}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500 text-sm">No project assigned</span>
                  </div>
                )}
              </div>
            )}
            
            {task.createdBy && (
              <p className="text-gray-500 text-sm">
                Assigned by: {task.createdBy.name}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
            {task.priority && (
              <span className={`text-xs font-medium ${
                task.priority === 'urgent' ? 'text-red-600' :
                task.priority === 'high' ? 'text-orange-600' :
                task.priority === 'medium' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {task.priority} priority
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-4">
            {task.dueDate && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span className={isOverdue(task.dueDate, task.status) ? 'text-red-600 font-medium' : ''}>
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {task.actualHours > 0 && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{task.actualHours}h logged</span>
              </div>
            )}
          </div>
        </div>

        {/* Special Instructions */}
        {task.specialInstructions && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Special Instructions:</strong> {task.specialInstructions}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowStatusUpdate(!showStatusUpdate)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Update Status
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => onViewDetails(task._id)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <Eye className="h-4 w-4" />
              <span>View Details</span>
            </button>
          </div>
          
          {showStatusUpdate && (
            <div className="flex items-center space-x-2">
              {task.status === 'pending' && (
                <button
                  onClick={() => handleQuickStatusChange('in-progress')}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                >
                  Start
                </button>
              )}
              {task.status === 'in-progress' && (
                <>
                  <button
                    onClick={() => handleQuickStatusChange('review')}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-xs hover:bg-purple-200"
                  >
                    Submit for Review
                  </button>
                  <button
                    onClick={() => handleQuickStatusChange('blocked')}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
                  >
                    Blocked
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Project Details Modal Component
const ProjectDetailsModal = ({ project, tasks, onClose, getStatusColor }) => {
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.projectName}</h2>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                <span className="text-sm text-gray-600">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </span>
                {project.deadline && (
                  <span className="text-sm text-gray-600">
                    Due: {new Date(project.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Project Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">Client:</span>
                  <p className="mt-1 font-medium text-gray-900">{project.clientName}</p>
                </div>
                {project.description && (
                  <div>
                    <span className="text-gray-600">Description:</span>
                    <p className="mt-1 text-gray-900">{project.description}</p>
                  </div>
                )}
                {project.category && (
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <p className="mt-1 text-gray-900 capitalize">{project.category}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Task Overview</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tasks:</span>
                  <span className="font-medium">{taskStats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Completed:</span>
                  <span className="font-medium">{taskStats.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">In Progress:</span>
                  <span className="font-medium">{taskStats.inProgress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-600">Pending:</span>
                  <span className="font-medium">{taskStats.pending}</span>
                </div>
                {taskStats.blocked > 0 && (
                  <div className="flex justify-between">
                    <span className="text-red-600">Blocked:</span>
                    <span className="font-medium">{taskStats.blocked}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Information */}
          {(project.teamLead || (project.employees && project.employees.length > 0)) && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Team</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {project.teamLead && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Team Lead</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-900">{project.teamLead.name}</p>
                      <p className="text-sm text-gray-600">{project.teamLead.email}</p>
                    </div>
                  </div>
                )}
                
                {project.employees && project.employees.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Team Members</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {project.employees.map(employee => (
                        <div key={employee._id} className="bg-gray-50 rounded p-2">
                          <p className="font-medium text-sm text-gray-900">{employee.name}</p>
                          <p className="text-xs text-gray-600">{employee.email}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Project Tasks */}
          {tasks.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Tasks in this Project</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tasks.map(task => (
                  <div key={task._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mb-2 line-clamp-2">{task.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        {task.dueDate && (
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        )}
                        {task.actualHours > 0 && (
                          <span>{task.actualHours}h logged</span>
                        )}
                      </div>
                      {task.priority && (
                        <span className={`text-xs font-medium ${
                          task.priority === 'urgent' ? 'text-red-600' :
                          task.priority === 'high' ? 'text-orange-600' :
                          task.priority === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {task.priority} priority
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Task Details Modal Component (simplified version for space)
const TaskDetailsModal = ({ task, onClose, onStatusChange, getStatusColor }) => {
  const [newResponse, setNewResponse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(task.status);
  const [statusNotes, setStatusNotes] = useState('');

  const handleStatusChange = async () => {
    if (selectedStatus === task.status) return;
    await onStatusChange(task._id, selectedStatus, statusNotes);
    onClose();
  };

 const handleAddResponse = async () => {
  if (!newResponse.trim()) return;
  try {
    await api.post(`/projects/employee/tasks/${task._id}/response`, { // CHANGE: was '/employee/tasks/${task._id}/response'
      message: newResponse,
      type: 'progress'
    });
    setNewResponse('');
    alert('Response added successfully!');
  } catch (error) {
    console.error('Error adding response:', error);
  }
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h2>
              {task.project && (
                <div className="flex items-center space-x-2 mb-2">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600 font-medium">{task.project.projectName}</span>
                </div>
              )}
              <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700">{task.description}</p>
          </div>

          {task.specialInstructions && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
              <p className="text-gray-700 bg-yellow-50 p-3 rounded border border-yellow-200">
                {task.specialInstructions}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {task.dueDate && (
              <div>
                <span className="text-gray-600">Due Date:</span>
                <p className="font-medium">{new Date(task.dueDate).toLocaleDateString()}</p>
              </div>
            )}
            <div>
              <span className="text-gray-600">Time Logged:</span>
              <p className="font-medium">{task.actualHours || 0} hours</p>
            </div>
          </div>

          {/* Status Update */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
            <div className="space-y-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="blocked">Blocked</option>
              </select>
              
              {selectedStatus !== task.status && (
                <>
                  <textarea
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Add notes about this status change..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleStatusChange}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Update Status
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Add Response */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Add Response</h3>
            <div className="space-y-3">
              <textarea
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                placeholder="Share your progress, ask questions, or report issues..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddResponse}
                disabled={!newResponse.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Response
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard