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
  MessageSquare
} from 'lucide-react';
import api from '../../../../services/api';

const NotificationTab = () => {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('view');
  const [stats, setStats] = useState({ total: 0, read: 0, unread: 0 });
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
    page: 1
  });

  // Form states
  const [sendForm, setSendForm] = useState({
    type: 'specific',
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

  // Fetch data functions
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: filters.page,
        limit: pagination.limit,
        ...(filters.type !== 'all' && { type: filters.type })
      });
      
      const response = await api.get(`/notifications/admin/all?${params}`);
      setNotifications(response.data.notifications);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/notifications/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/notifications/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
    fetchStats();
  }, [filters]);

  // Send notification functions
  const sendNotification = async () => {
    try {
      setLoading(true);
      let endpoint = '/notifications/send';
      let payload = {
        message: sendForm.message,
        type: sendForm.notificationType,
        priority: sendForm.priority,
        ...(sendForm.expiresAt && { expiresAt: sendForm.expiresAt })
      };

      switch (sendForm.type) {
        case 'specific':
          payload.receivers = sendForm.receivers;
          break;
        case 'employees':
          endpoint = '/notifications/send-to-employees';
          break;
        case 'teamleads':
          endpoint = '/notifications/send-to-teamleads';
          break;
        case 'all':
          endpoint = '/notifications/send-to-all';
          break;
      }

      await api.post(endpoint, payload);
      
      // Reset form and refresh data
      setSendForm({
        type: 'specific',
        receivers: [],
        message: '',
        notificationType: 'info',
        priority: 'normal',
        expiresAt: ''
      });
      
      fetchNotifications();
      fetchStats();
      setActiveTab('view');
      
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateNotification = async (id, updates) => {
    try {
      await api.put(`/notifications/${id}`, updates);
      fetchNotifications();
      setEditingNotification(null);
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const deleteNotification = async (id) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                </div>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
                >
                  <option value="all">All Types</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="alert">Alert</option>
                  <option value="task">Task</option>
                  <option value="report">Report</option>
                </select>
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
                    return (
                      <div
                        key={notification._id}
                        className={`bg-white border-l-4 ${priorityColors[notification.priority]} rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className={`p-2 rounded-lg ${notificationTypes[notification.type]?.bgColor}`}>
                              <TypeIcon className={`w-5 h-5 ${notificationTypes[notification.type]?.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  From: {notification.sender?.name || 'Unknown'}
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
                              </div>
                              <p className="text-gray-800 mb-2">{notification.message}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {notification.receivers?.length || 0} recipients
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
                              onClick={() => setEditingNotification(notification)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.current <= 1}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {pagination.current} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                    disabled={pagination.current >= pagination.pages}
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
                        className={`p-3 border rounded-lg text-center transition-colors ${
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Users</label>
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
                      {users.map(user => (
                        <label key={user._id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sendForm.receivers.includes(user._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSendForm(prev => ({ ...prev, receivers: [...prev.receivers, user._id] }));
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
                      ))}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
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
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={sendNotification}
                  disabled={loading || !sendForm.message || (sendForm.type === 'specific' && sendForm.receivers.length === 0)}
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
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingNotification(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
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