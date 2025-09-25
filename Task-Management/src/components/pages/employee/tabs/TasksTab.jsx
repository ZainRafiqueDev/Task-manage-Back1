import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import { 
  CheckCircle, Clock, AlertTriangle, PlayCircle, PauseCircle, 
  MessageSquare, Plus, Calendar, Filter, Search, Eye, 
  ChevronDown, ChevronRight, Timer, Send 
} from 'lucide-react';

const TasksTab = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [timeTracker, setTimeTracker] = useState({});
  const [showTimeModal, setShowTimeModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employee/tasks');
      setTasks(response.data.tasks || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskDetails = async (taskId) => {
    try {
      const response = await api.get(`/employee/tasks/${taskId}`);
      setSelectedTask(response.data.task);
    } catch (error) {
      console.error('Error fetching task details:', error);
    }
  };

  const updateTaskStatus = async (taskId, status, notes = '') => {
    try {
      await api.patch(`/employee/tasks/${taskId}/status`, { status, notes });
      fetchTasks(); // Refresh tasks
      if (selectedTask && selectedTask._id === taskId) {
        fetchTaskDetails(taskId); // Refresh selected task
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'review': 'bg-purple-100 text-purple-800 border-purple-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'blocked': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'text-green-600',
      'medium': 'text-yellow-600',
      'high': 'text-orange-600',
      'urgent': 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const isOverdue = (dueDate, status) => {
    return dueDate && new Date(dueDate) < new Date() && status !== 'completed';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <span>{stats.total || 0} total</span>
            <span>{stats.completed || 0} completed</span>
            <span>{stats.pending || 0} pending</span>
            {stats.overdue > 0 && (
              <span className="text-red-600 font-medium">{stats.overdue} overdue</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowTimeModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Timer className="h-4 w-4" />
          <span>Log Time</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
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
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'You have no tasks assigned at the moment.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onViewDetails={fetchTaskDetails}
              onStatusChange={updateTaskStatus}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
              isOverdue={isOverdue}
            />
          ))}
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={updateTaskStatus}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          isOverdue={isOverdue}
        />
      )}

      {/* Time Logging Modal */}
      {showTimeModal && (
        <TimeLoggingModal
          tasks={tasks}
          onClose={() => setShowTimeModal(false)}
          onTimeLogged={fetchTasks}
        />
      )}
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task, onViewDetails, onStatusChange, getStatusColor, getPriorityColor, isOverdue }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

  const handleQuickStatusChange = async (newStatus) => {
    await onStatusChange(task._id, newStatus);
    setShowStatusUpdate(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {task.title}
              </h3>
              {isOverdue(task.dueDate, task.status) && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-gray-600 text-sm mb-2">{task.description}</p>
            {task.project && (
              <p className="text-blue-600 text-sm font-medium">
                {task.project.projectName}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
            <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority} priority
            </span>
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
            {task.createdBy && (
              <span>Assigned by: {task.createdBy.name}</span>
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

        {/* Recent Activity Preview */}
        {(task.logs && task.logs.length > 0) || (task.employeeResponses && task.employeeResponses.length > 0) ? (
          <div className="border-t pt-4 mb-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span>Recent Activity</span>
            </button>
            
            {isExpanded && (
              <div className="mt-3 space-y-2">
                {task.logs && task.logs.slice(-2).map((log, index) => (
                  <div key={index} className="bg-gray-50 rounded p-3 text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">Time Log</span>
                      <span className="text-gray-500 text-xs">
                        {new Date(log.createdAt || log.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{log.update}</p>
                    {log.totalTime && (
                      <span className="text-gray-500 text-xs">
                        Duration: {Math.round(log.totalTime)} minutes
                      </span>
                    )}
                  </div>
                ))}
                
                {task.employeeResponses && task.employeeResponses.slice(-1).map((response, index) => (
                  <div key={index} className="bg-blue-50 rounded p-3 text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">Response</span>
                      <span className="text-gray-500 text-xs">
                        {new Date(response.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{response.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

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

// Task Details Modal Component
const TaskDetailsModal = ({ task, onClose, onStatusChange, getStatusColor, getPriorityColor, isOverdue }) => {
  const [newResponse, setNewResponse] = useState('');
  const [responseType, setResponseType] = useState('progress');
  const [statusNotes, setStatusNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(task.status);

  const handleAddResponse = async () => {
    if (!newResponse.trim()) return;
    
    try {
      await api.post(`/employee/tasks/${task._id}/response`, {
        message: newResponse,
        type: responseType
      });
      setNewResponse('');
      // Refresh task details
      const response = await api.get(`/employee/tasks/${task._id}`);
      // Update the task prop would need parent state management
      alert('Response added successfully!');
    } catch (error) {
      console.error('Error adding response:', error);
      alert('Error adding response');
    }
  };

  const handleStatusChange = async () => {
    if (selectedStatus === task.status) return;
    
    try {
      await onStatusChange(task._id, selectedStatus, statusNotes);
      setStatusNotes('');
      onClose(); // Close modal after status update
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {task.title}
              </h2>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
                <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority} priority
                </span>
                {isOverdue(task.dueDate, task.status) && (
                  <span className="flex items-center space-x-1 text-red-600 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Overdue</span>
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Task Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Task Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">Description:</span>
                  <p className="mt-1 text-gray-900">{task.description}</p>
                </div>
                {task.specialInstructions && (
                  <div>
                    <span className="text-gray-600">Special Instructions:</span>
                    <p className="mt-1 text-gray-900 bg-yellow-50 p-3 rounded border border-yellow-200">
                      {task.specialInstructions}
                    </p>
                  </div>
                )}
                {task.project && (
                  <div>
                    <span className="text-gray-600">Project:</span>
                    <p className="mt-1 font-medium text-blue-600">
                      {task.project.projectName}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Task Info</h3>
              <div className="space-y-3">
                {task.dueDate && (
                  <div>
                    <span className="text-gray-600">Due Date:</span>
                    <p className={`mt-1 font-medium ${isOverdue(task.dueDate, task.status) ? 'text-red-600' : 'text-gray-900'}`}>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Time Logged:</span>
                  <p className="mt-1 font-medium text-gray-900">
                    {task.actualHours || 0} hours
                  </p>
                </div>
                {task.createdBy && (
                  <div>
                    <span className="text-gray-600">Assigned by:</span>
                    <p className="mt-1 font-medium text-gray-900">
                      {task.createdBy.name}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Created:</span>
                  <p className="mt-1 text-gray-900">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Update Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              
              {selectedStatus !== task.status && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Add any notes about this status change..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              
              {selectedStatus !== task.status && (
                <button
                  onClick={handleStatusChange}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Status
                </button>
              )}
            </div>
          </div>

          {/* Add Response Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Response</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Type
                </label>
                <select
                  value={responseType}
                  onChange={(e) => setResponseType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="progress">Progress Update</option>
                  <option value="issue">Issue/Problem</option>
                  <option value="pending-info">Pending Information</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  placeholder="Describe your progress, issues, or questions..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={handleAddResponse}
                disabled={!newResponse.trim()}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>Send Response</span>
              </button>
            </div>
          </div>

          {/* Time Logs */}
          {task.logs && task.logs.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Logs</h3>
              <div className="space-y-3">
                {task.logs.map((log, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{log.update}</h4>
                      <div className="text-sm text-gray-500">
                        {new Date(log.createdAt || log.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    {log.description && (
                      <p className="text-gray-700 text-sm mb-2">{log.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {log.startTime && log.endTime && (
                        <>
                          <span>
                            {new Date(log.startTime).toLocaleTimeString()} - {new Date(log.endTime).toLocaleTimeString()}
                          </span>
                          <span>Duration: {Math.round(log.totalTime || 0)} minutes</span>
                        </>
                      )}
                      {log.updatedBy && (
                        <span>Logged by: {log.updatedBy.name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employee Responses */}
          {task.employeeResponses && task.employeeResponses.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Responses</h3>
              <div className="space-y-3">
                {task.employeeResponses.map((response, index) => (
                  <div key={index} className="bg-blue-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          response.type === 'issue' ? 'bg-red-100 text-red-800' :
                          response.type === 'pending-info' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {response.type}
                        </span>
                        <span className="text-sm text-gray-600">
                          {response.createdBy?.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(response.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-900">{response.message}</p>
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

// Time Logging Modal Component
const TimeLoggingModal = ({ tasks, onClose, onTimeLogged }) => {
  const [selectedTask, setSelectedTask] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [update, setUpdate] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTask || !startTime || !endTime || !update) {
      alert('Please fill in all required fields');
      return;
    }

    if (new Date(endTime) <= new Date(startTime)) {
      alert('End time must be after start time');
      return;
    }

    try {
      await api.post(`/employee/tasks/${selectedTask}/log-time`, {
        startTime,
        endTime,
        description,
        update
      });
      
      onTimeLogged();
      onClose();
      alert('Time logged successfully!');
    } catch (error) {
      console.error('Error logging time:', error);
      alert('Error logging time');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Log Time</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task *
            </label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a task...</option>
              {tasks.filter(t => t.status !== 'completed').map((task) => (
                <option key={task._id} value={task._id}>
                  {task.title} - {task.project?.projectName || 'No Project'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Description *
            </label>
            <input
              type="text"
              value={update}
              onChange={(e) => setUpdate(e.target.value)}
              placeholder="What did you work on?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any additional details about the work..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Log Time
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TasksTab;