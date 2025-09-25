import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Users, 
  UserCheck, 
  Shield, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  CheckSquare,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  RotateCcw
} from 'lucide-react';
import api from '../../../../services/api';

const NotificationTab = () => {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('view');
  const [stats, setStats] = useState({ total: 0, read: 0, unread: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  
  // Filters
  const [filters, setFilters] = useState({
    type: 'all',
    search: '',
    page: 1,
    status: 'all' // Add status filter for read/unread
  });

  // Form states
  const [sendForm, setSendForm] = useState({
    type: 'all',
    receivers: [],
    message: '',
    notificationType: 'info',
    priority: 'normal',
    expiresAt: ''
  });

  const [editingNotification, setEditingNotification] = useState(null);

  // Notification types and their icons
  const notificationTypes = {
    info: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    warning: { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    alert: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
    task: { icon: CheckSquare, color: 'text-green-600', bgColor: 'bg-green-100' },
    report: { icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-100' }
  };

  const priorityColors = {
    low: 'border-l-gray-400',
    normal: 'border-l-blue-400',
    high: 'border-l-orange-400',
    urgent: 'border-l-red-500'
  };

  // Utility functions
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 5000);
  };

  // Fetch data functions
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (filters.type !== 'all') {
        params.append('type', filters.type);
      }
      
      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }
      
      if (filters.search.trim()) {
        params.append('search', filters.search.trim());
      }
      
      const response = await api.get(`/notifications/admin/all?${params}`);
      
      if (response.data) {
        setNotifications(response.data.notifications || []);
        setPagination(response.data.pagination || { current: 1, pages: 1, total: 0, limit: 10 });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showError('Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/notifications/users');
      // Handle the actual API response structure
      const users = response.data?.data || response.data?.users || [];
      setUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Failed to fetch users');
      setUsers([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/notifications/admin/stats');
      setStats(response.data || { total: 0, read: 0, unread: 0 });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ total: 0, read: 0, unread: 0 });
    }
  };

  // Effects
  useEffect(() => {
    fetchNotifications();
  }, [filters.page, filters.type, filters.status]);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.search !== '' || filters.page !== 1) {
        setFilters(prev => ({ ...prev, page: 1 }));
        fetchNotifications();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  // Send notification function
  const sendNotification = async () => {
    if (!sendForm.message.trim()) {
      showError("Message is required");
      return;
    }

    if (sendForm.type === 'specific' && sendForm.receivers.length === 0) {
      showError("Please select at least one user");
      return;
    }

    try {
      setLoading(true);
      setError('');

      let payload = {
        message: sendForm.message.trim(),
        type: sendForm.notificationType,
        priority: sendForm.priority,
      };

      // Add expiry date if provided
      if (sendForm.expiresAt) {
        payload.expiresAt = sendForm.expiresAt;
      }

      // Add receivers for specific users
      if (sendForm.type === "specific") {
        payload.receivers = sendForm.receivers;
      } else {
        payload.sendToAll = sendForm.type;
      }

      const response = await api.post("/notifications/send", payload);

      if (response.data?.success) {
        showSuccess("Notification sent successfully!");
        setSendForm({
          type: "all",
          receivers: [],
          message: "",
          notificationType: "info",
          priority: "normal",
          expiresAt: "",
        });
        fetchNotifications();
        fetchStats();
      } else {
        showError(response.data?.message || "Failed to send notification");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      showError(error.response?.data?.message || "Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  const updateNotification = async (id, updates) => {
    try {
      setLoading(true);
      setError('');

      const response = await api.put(`/notifications/${id}`, updates);
      
      if (response.data?.success) {
        showSuccess("Notification updated successfully!");
        fetchNotifications();
        setEditingNotification(null);
      } else {
        showError("Failed to update notification");
      }
    } catch (error) {
      console.error('Error updating notification:', error);
      showError(error.response?.data?.message || "Failed to update notification");
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      setLoading(true);
      setError('');

      const response = await api.delete(`/notifications/${id}`);
      
      if (response.data?.success) {
        showSuccess("Notification deleted successfully!");
        fetchNotifications();
        fetchStats();
      } else {
        showError("Failed to delete notification");
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      showError(error.response?.data?.message || "Failed to delete notification");
    } finally {
      setLoading(false);
    }
  };

  // Admin read/unread functionality
  const toggleReadStatus = async (notificationId, currentStatus) => {
    try {
      setLoading(true);
      setError('');

      const endpoint = currentStatus === 'read' ? 'unread' : 'read';
      const response = await api.put(`/notifications/admin/${notificationId}/${endpoint}`);
      
      if (response.data?.success) {
        showSuccess(`Notification marked as ${endpoint} successfully!`);
        fetchNotifications();
        fetchStats();
      } else {
        showError(`Failed to mark notification as ${endpoint}`);
      }
    } catch (error) {
      console.error(`Error marking notification as ${endpoint}:`, error);
      showError(error.response?.data?.message || `Failed to mark notification as ${endpoint}`);
    } finally {
      setLoading(false);
    }
  };

  // Bulk operations
  const bulkMarkAsRead = async () => {
    if (!window.confirm('Mark all notifications as read?')) return;
    
    try {
      setLoading(true);
      setError('');

      const response = await api.put('/notifications/admin/bulk/mark-read');
      
      if (response.data?.success) {
        showSuccess("All notifications marked as read!");
        fetchNotifications();
        fetchStats();
      } else {
        showError("Failed to mark notifications as read");
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      showError(error.response?.data?.message || "Failed to mark notifications as read");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="h-8 w-8 text-blue-600" />
            Notification Management
          </h1>
          <p className="mt-2 text-gray-600">Manage and send notifications to users</p>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Read Notifications</p>
                <p className="text-3xl font-bold text-green-600">{stats.read}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread Notifications</p>
                <p className="text-3xl font-bold text-orange-600">{stats.unread}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <EyeOff className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('view')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'view'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye className="inline-block w-4 h-4 mr-2" />
              View Notifications
            </button>
            <button
              onClick={() => setActiveTab('send')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'send'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Send className="inline-block w-4 h-4 mr-2" />
              Send Notification
            </button>
          </div>

          {/* View Notifications Tab */}
          {activeTab === 'view' && (
            <div className="p-6">
              {/* Filters and Bulk Actions */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4 flex-1">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search notifications..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                    </div>
                  </div>
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="alert">Alert</option>
                    <option value="task">Task</option>
                    <option value="report">Report</option>
                  </select>
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="read">Read</option>
                    <option value="unread">Unread</option>
                  </select>
                </div>
                <button
                  onClick={bulkMarkAsRead}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark All Read
                </button>
              </div>

              {/* Notifications List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">No notifications found</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const TypeIcon = notificationTypes[notification.type]?.icon || Info;
                    const isRead = notification.readBy && notification.readBy.length > 0;
                    
                    return (
                      <div
                        key={notification._id}
                        className={`bg-white border-l-4 ${priorityColors[notification.priority]} rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${
                          !isRead ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className={`p-2 rounded-lg ${notificationTypes[notification.type]?.bgColor}`}>
                              <TypeIcon className={`w-5 h-5 ${notificationTypes[notification.type]?.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  From: {notification.sender?.name || 'System'}
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                  {notification.type}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  notification.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                  notification.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  notification.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {notification.priority}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  isRead ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {isRead ? 'Read' : 'Unread'}
                                </span>
                              </div>
                              <p className="text-gray-800 mb-2">{notification.message}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {notification.receivers?.length || 0} recipients
                                </div>
                                <div className="flex items-center gap-1">
                                  <UserCheck className="w-4 h-4" />
                                  {notification.readBy?.length || 0} read
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatDate(notification.createdAt)}
                                </div>
                                {notification.expiresAt && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Expires: {formatDate(notification.expiresAt)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleReadStatus(notification._id, isRead ? 'read' : 'unread')}
                              disabled={loading}
                              className={`p-2 transition-colors disabled:opacity-50 ${
                                isRead 
                                  ? 'text-gray-400 hover:text-orange-600' 
                                  : 'text-gray-400 hover:text-green-600'
                              }`}
                              title={isRead ? 'Mark as Unread' : 'Mark as Read'}
                            >
                              {isRead ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setEditingNotification(notification)}
                              disabled={loading}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              disabled={loading}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <button
                    onClick={() => handlePageChange(Math.max(1, pagination.current - 1))}
                    disabled={pagination.current <= 1 || loading}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {pagination.current} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(Math.min(pagination.pages, pagination.current + 1))}
                    disabled={pagination.current >= pagination.pages || loading}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Send Notification Tab */}
          {activeTab === 'send' && (
            <div className="p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Recipient Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Send To</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'specific', label: 'Specific Users', icon: UserCheck },
                      { value: 'employees', label: 'All Employees', icon: Users },
                      { value: 'teamleads', label: 'Team Leads', icon: Shield },
                      { value: 'all', label: 'Everyone', icon: Users }
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setSendForm(prev => ({ ...prev, type: value, receivers: [] }))}
                        disabled={loading}
                        className={`p-3 border rounded-lg text-center transition-colors disabled:opacity-50 ${
                          sendForm.type === value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-sm font-medium">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific Users Selection */}
                {sendForm.type === 'specific' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Users ({sendForm.receivers.length} selected)
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
                      {users.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No users available
                        </div>
                      ) : (
                        users.map(user => (
                          <label key={user._id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sendForm.receivers.includes(user._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSendForm(prev => ({ 
                                    ...prev, 
                                    receivers: [...prev.receivers, user._id] 
                                  }));
                                } else {
                                  setSendForm(prev => ({ 
                                    ...prev, 
                                    receivers: prev.receivers.filter(id => id !== user._id) 
                                  }));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.role} • {user.email}</div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your notification message..."
                    value={sendForm.message}
                    onChange={(e) => setSendForm(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                {/* Type and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={sendForm.notificationType}
                      onChange={(e) => setSendForm(prev => ({ ...prev, notificationType: e.target.value }))}
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="alert">Alert</option>
                      <option value="task">Task</option>
                      <option value="report">Report</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={sendForm.priority}
                      onChange={(e) => setSendForm(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={sendForm.expiresAt}
                    onChange={(e) => setSendForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={sendNotification}
                  disabled={
                    loading || 
                    !sendForm.message.trim() || 
                    (sendForm.type === 'specific' && sendForm.receivers.length === 0)
                  }
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Notification
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Edit Notification</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editingNotification.message}
                    onChange={(e) => setEditingNotification(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editingNotification.type}
                    onChange={(e) => setEditingNotification(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="alert">Alert</option>
                    <option value="task">Task</option>
                    <option value="report">Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editingNotification.priority}
                    onChange={(e) => setEditingNotification(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => updateNotification(editingNotification._id, {
                      message: editingNotification.message,
                      type: editingNotification.type,
                      priority: editingNotification.priority
                    })}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditingNotification(null)}
                    disabled={loading}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationTab;