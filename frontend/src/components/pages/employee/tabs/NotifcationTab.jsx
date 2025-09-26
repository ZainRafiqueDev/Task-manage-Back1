import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import { 
  Bell, BellOff, CheckCircle, AlertTriangle, Info, 
  MessageSquare, FileText, Package, Calendar, Filter,
  MoreVertical, Trash2, Mail, Send, Users,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';

const NotificationsTab = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(filter === 'unread' && { unreadOnly: 'true' })
      });

      // Fixed: Use correct endpoint for employee notifications
      const response = await api.get(`/notifications/my?${queryParams}`);
      setNotifications(response.data.notifications || response.data.data || []);
      setUnreadCount(response.data.unreadCount || 0);
      
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // Fixed: Use correct endpoint
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notif => 
        notif._id === notificationId ? {...notif, isRead: true} : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAsUnread = async (notificationId) => {
    try {
      // Fixed: Use correct endpoint
      await api.put(`/notifications/${notificationId}/unread`);
      setNotifications(notifications.map(notif => 
        notif._id === notificationId ? {...notif, isRead: false} : notif
      ));
      setUnreadCount(prev => prev + 1);
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Fixed: Use correct endpoint
      await api.put('/notifications/mark-all-read');
      setNotifications(notifications.map(notif => ({...notif, isRead: true})));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const bulkMarkAsRead = async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      // Fixed: Use correct endpoint
      await api.put('/notifications/bulk/mark-read', {
        notificationIds: selectedNotifications
      });
      
      setNotifications(notifications.map(notif => 
        selectedNotifications.includes(notif._id) ? {...notif, isRead: true} : notif
      ));
      
      const unmarkedCount = selectedNotifications.filter(id => {
        const notif = notifications.find(n => n._id === id);
        return notif && !notif.isRead;
      }).length;
      
      setUnreadCount(prev => Math.max(0, prev - unmarkedCount));
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error bulk marking as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      // Fixed: Use correct endpoint
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(notifications.filter(notif => notif._id !== notificationId));
      
      const deletedNotif = notifications.find(n => n._id === notificationId);
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const toggleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = notifications.map(n => n._id);
    setSelectedNotifications(visibleIds);
  };

  const clearSelection = () => {
    setSelectedNotifications([]);
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'info': Info,
      'warning': AlertTriangle,
      'alert': AlertTriangle,
      'task': CheckCircle,
      'report': FileText,
      'asset': Package,
      'message': MessageSquare
    };
    return icons[type] || Bell;
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'urgent') return 'border-red-500 bg-red-50';
    if (priority === 'high') return 'border-orange-500 bg-orange-50';
    
    const colors = {
      'info': 'border-blue-500 bg-blue-50',
      'warning': 'border-yellow-500 bg-yellow-50',
      'alert': 'border-red-500 bg-red-50',
      'task': 'border-green-500 bg-green-50',
      'report': 'border-purple-500 bg-purple-50',
      'asset': 'border-gray-500 bg-gray-50',
      'message': 'border-indigo-500 bg-indigo-50'
    };
    return colors[type] || 'border-gray-300 bg-white';
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.type === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Send className="h-4 w-4" />
            <span>Send Message</span>
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
            <option value="info">Info</option>
            <option value="warning">Warnings</option>
            <option value="alert">Alerts</option>
            <option value="task">Tasks</option>
            <option value="report">Reports</option>
            <option value="asset">Assets</option>
            <option value="message">Messages</option>
          </select>
          
          {selectedNotifications.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedNotifications.length} selected
              </span>
              <button
                onClick={bulkMarkAsRead}
                className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
              >
                Mark Read
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={selectedNotifications.length === notifications.length ? clearSelection : selectAllVisible}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedNotifications.length === notifications.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
          <p className="text-gray-600">
            {filter === 'unread' 
              ? 'You\'re all caught up! No unread notifications.'
              : filter === 'all'
              ? 'You haven\'t received any notifications yet.'
              : `No ${filter} notifications found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              isSelected={selectedNotifications.includes(notification._id)}
              onToggleSelect={() => toggleSelectNotification(notification._id)}
              onMarkAsRead={() => markAsRead(notification._id)}
              onMarkAsUnread={() => markAsUnread(notification._id)}
              onDelete={() => deleteNotification(notification._id)}
              getIcon={getNotificationIcon}
              getColor={getNotificationColor}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showSendModal && (
        <SendMessageModal
          onClose={() => setShowSendModal(false)}
          onSend={() => {
            setShowSendModal(false);
            fetchNotifications();
          }}
        />
      )}
    </div>
  );
};

// Notification Card Component
const NotificationCard = ({ 
  notification, 
  isSelected, 
  onToggleSelect, 
  onMarkAsRead, 
  onMarkAsUnread, 
  onDelete,
  getIcon,
  getColor 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const Icon = getIcon(notification.type);

  const handleCardClick = () => {
    if (!notification.isRead) {
      onMarkAsRead();
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInHours = (now - notifDate) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - notifDate) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return notifDate.toLocaleDateString();
    }
  };

  return (
    <div
      className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
        notification.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
      } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${getColor(notification.type, notification.priority)}`}
      onClick={handleCardClick}
    >
      <div className="flex items-start space-x-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div className={`p-2 rounded-lg ${
            notification.priority === 'urgent' ? 'bg-red-200' :
            notification.priority === 'high' ? 'bg-orange-200' : 'bg-gray-200'
          }`}>
            <Icon className="h-5 w-5 text-gray-700" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className={`text-sm font-medium ${notification.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'}`}>
                  {notification.title}
                </h3>
                {!notification.isRead && (
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                )}
                {notification.priority && notification.priority !== 'normal' && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    notification.priority === 'high' ? 'bg-orange-100 text-orange-800' : ''
                  }`}>
                    {notification.priority}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {notification.message}
              </p>
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                <span>{formatDate(notification.createdAt)}</span>
                {notification.sender && (
                  <span>From: {notification.sender.name}</span>
                )}
                {notification.category && (
                  <span className="px-2 py-1 bg-gray-100 rounded-full capitalize">
                    {notification.category}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1 rounded-full hover:bg-gray-200"
                >
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                    <div className="py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          notification.isRead ? onMarkAsUnread() : onMarkAsRead();
                          setShowMenu(false);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Mail className="h-4 w-4" />
                        <span>Mark as {notification.isRead ? 'Unread' : 'Read'}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                          setShowMenu(false);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Send Message Modal Component
const SendMessageModal = ({ onClose, onSend }) => {
  const [messageData, setMessageData] = useState({
    receivers: [], // Fixed: Change to array for multiple recipients
    message: '',
    type: 'info',
    priority: 'normal'
  });
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(true);

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      setLoadingRecipients(true);
      // Fixed: Use correct endpoint and handle correct response structure
      const response = await api.get('/notifications/recipients/employee');
      console.log('Recipients response:', response.data); // Debug log
      setRecipients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching recipients:', error);
      // Optional: Show error to user
      alert('Error loading recipients. Please try again.');
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (messageData.receivers.length === 0 || !messageData.message) {
      alert('Please select at least one recipient and enter a message');
      return;
    }

    try {
      setLoading(true);
      // Fixed: Use correct endpoint and data structure
      await api.post('/notifications/send', {
        receivers: messageData.receivers,
        message: messageData.message,
        type: messageData.type,
        priority: messageData.priority
      });
      alert('Message sent successfully!');
      onSend();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + (error.response?.data?.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  const handleRecipientChange = (recipientId, isChecked) => {
    setMessageData(prev => ({
      ...prev,
      receivers: isChecked 
        ? [...prev.receivers, recipientId]
        : prev.receivers.filter(id => id !== recipientId)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Send Message</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipients * {messageData.receivers.length > 0 && `(${messageData.receivers.length} selected)`}
            </label>
            {loadingRecipients ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading recipients...</p>
              </div>
            ) : recipients.length === 0 ? (
              <p className="text-sm text-red-600">No recipients available</p>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                {recipients.map((recipient) => (
                  <label key={recipient._id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={messageData.receivers.includes(recipient._id)}
                      onChange={(e) => handleRecipientChange(recipient._id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {recipient.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {recipient.email} • {recipient.role}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={messageData.type}
              onChange={(e) => setMessageData({...messageData, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="alert">Alert</option>
              <option value="task">Task</option>
              <option value="message">Message</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={messageData.priority}
              onChange={(e) => setMessageData({...messageData, priority: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={messageData.message}
              onChange={(e) => setMessageData({...messageData, message: e.target.value})}
              placeholder="Type your message here..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingRecipients || messageData.receivers.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationsTab;