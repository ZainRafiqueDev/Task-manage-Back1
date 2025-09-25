import React, { useState, useEffect } from "react";
import api from "../../../../services/api";
import { 
  Bell, Users, CheckCircle, Mail, XCircle, Send, Eye, Clock, 
  AlertCircle, Trash2, Edit3, Filter, Plus, MoreVertical 
} from "lucide-react";

const NotificationTab = () => {
  const [message, setMessage] = useState("");
  const [receiver, setReceiver] = useState("");
  const [recipientType, setRecipientType] = useState("single");
  const [type, setType] = useState("info");
  const [priority, setPriority] = useState("normal");
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, read: 0, unread: 0, unreadCount: 0 });
  const [loading, setLoading] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [filter, setFilter] = useState({ type: 'all', unreadOnly: false });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  /* ----------------- FETCH USERS FOR TEAMLEAD ----------------- */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/notifications/users/teamlead");
        setUsers(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();
  }, []);

  /* ----------------- FETCH ADMINS FOR REPORTS ----------------- */
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const res = await api.get("/notifications/users"); // This should return admin users for teamleads
        const adminUsers = (res.data.data || []).filter(user => user.role === 'admin');
        setAdmins(adminUsers);
      } catch (err) {
        console.error("Failed to fetch admin users", err);
      }
    };
    fetchAdmins();
  }, []);

  /* ----------------- FETCH NOTIFICATIONS WITH FILTERS ----------------- */
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (filter.type !== 'all') queryParams.append('type', filter.type);
        if (filter.unreadOnly) queryParams.append('unreadOnly', 'true');
        
        const res = await api.get(`/notifications/my?${queryParams.toString()}`);
        // Fixed: Use correct data structure from API response
        setSentNotifications(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };
    fetchNotifications();
  }, [filter]);

  /* ----------------- FETCH NOTIFICATION STATS ----------------- */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/notifications/stats");
        setStats(res.data || {});
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
  }, []);

  /* ----------------- SUCCESS MESSAGE HANDLER ----------------- */
  const showSuccessMessage = (msg) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  /* ----------------- HANDLE SEND NOTIFICATION ----------------- */
  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let res;
      const payload = { 
        message: message.trim(), 
        type, 
        priority,
        ...(receiver && recipientType === "single" && { receivers: [receiver] })
      };

      if (recipientType === "single") {
        res = await api.post("/notifications/send", payload);
      } else if (recipientType === "employees") {
        res = await api.post("/notifications/send-to-employees", payload);
      } else if (recipientType === "admins") {
        // Send report to all admins
        const adminIds = admins.map(admin => admin._id);
        const adminPayload = {
          ...payload,
          receivers: adminIds,
          type: "report" // Override type to report for admin notifications
        };
        res = await api.post("/notifications/send", adminPayload);
      }

      showSuccessMessage(res.data.message || "Notification sent successfully!");
      setMessage("");
      setReceiver("");
      setType("info");
      setPriority("normal");
      
      // Refresh notifications and stats
      const updatedNotifications = await api.get("/notifications/my");
      // Fixed: Use correct data structure
      setSentNotifications(updatedNotifications.data.data || []);
      
      const updatedStats = await api.get("/notifications/stats");
      setStats(updatedStats.data || {});
      
    } catch (err) {
      console.error("Error sending notification", err);
      alert(err.response?.data?.message || "Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------- MARK AS READ/UNREAD ----------------- */
  const toggleReadStatus = async (notificationId, isCurrentlyRead) => {
    try {
      const endpoint = isCurrentlyRead ? `/${notificationId}/unread` : `/${notificationId}/read`;
      await api.put(`/notifications${endpoint}`);
      
      // Update local state - Fixed: Update isRead property correctly
      setSentNotifications(prev => 
        prev.map(n => 
          n._id === notificationId 
            ? { ...n, isRead: !isCurrentlyRead }
            : n
        )
      );
      
      // Refresh stats
      const updatedStats = await api.get("/notifications/stats");
      setStats(updatedStats.data || {});
      
    } catch (err) {
      console.error("Error toggling read status", err);
    }
  };

  /* ----------------- DELETE NOTIFICATION ----------------- */
  const deleteNotification = async (notificationId) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    
    try {
      await api.delete(`/notifications/${notificationId}`);
      setSentNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Refresh stats
      const updatedStats = await api.get("/notifications/stats");
      setStats(updatedStats.data || {});
      
      showSuccessMessage("Notification deleted successfully!");
    } catch (err) {
      console.error("Error deleting notification", err);
      alert(err.response?.data?.message || "Failed to delete notification");
    }
  };

  /* ----------------- MARK ALL AS READ ----------------- */
  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/mark-all-read");
      
      // Update local state
      setSentNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      // Refresh stats
      const updatedStats = await api.get("/notifications/stats");
      setStats(updatedStats.data || {});
      
      showSuccessMessage("All notifications marked as read!");
    } catch (err) {
      console.error("Error marking all as read", err);
    }
  };

  /* ----------------- GET PRIORITY COLOR ----------------- */
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent": return "text-red-600 bg-red-100";
      case "high": return "text-orange-600 bg-orange-100";
      case "normal": return "text-blue-600 bg-blue-100";
      case "low": return "text-gray-600 bg-gray-100";
      default: return "text-blue-600 bg-blue-100";
    }
  };

  /* ----------------- GET TYPE ICON ----------------- */
  const getTypeIcon = (type) => {
    switch (type) {
      case "alert": return <AlertCircle className="w-4 h-4" />;
      case "warning": return <XCircle className="w-4 h-4" />;
      case "task": return <CheckCircle className="w-4 h-4" />;
      case "report": return <Eye className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Notifications</h1>
          <p className="text-gray-600 mt-2">Manage and send notifications to your team members</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={markAllAsRead}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Bell className="text-blue-600 w-12 h-12 bg-blue-100 p-3 rounded-full" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Read</p>
              <p className="text-3xl font-bold text-gray-900">{stats.read}</p>
            </div>
            <CheckCircle className="text-green-600 w-12 h-12 bg-green-100 p-3 rounded-full" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-red-500 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Unread</p>
              <p className="text-3xl font-bold text-gray-900">{stats.unread || stats.unreadCount}</p>
            </div>
            <XCircle className="text-red-600 w-12 h-12 bg-red-100 p-3 rounded-full" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Team Members</p>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            </div>
            <Users className="text-purple-600 w-12 h-12 bg-purple-100 p-3 rounded-full" />
          </div>
        </div>
      </div>

      {/* Send Notification Form */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Send className="text-blue-600 w-6 h-6" />
          <h2 className="text-2xl font-bold text-gray-900">Send New Notification</h2>
        </div>

        <form onSubmit={handleSend} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recipient Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Type</label>
              <select
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="single">Single User</option>
                <option value="employees">All Employees</option>
                <option value="admins">Send Report to Admins</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="alert">Alert</option>
                <option value="task">Task</option>
                <option value="report">Report</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Receiver Dropdown (for single user) */}
            {recipientType === "single" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select User</label>
                <select
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Choose a user...</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Admin Selection Info (for admin reports) */}
            {recipientType === "admins" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Report Recipients</label>
                <div className="w-full border border-gray-300 p-3 rounded-xl bg-blue-50">
                  <p className="text-blue-800 font-medium">
                    Report will be sent to {admins.length} admin{admins.length !== 1 ? 's' : ''}:
                  </p>
                  <div className="mt-2 space-y-1">
                    {admins.map((admin) => (
                      <div key={admin._id} className="text-sm text-blue-700">
                        • {admin.name} ({admin.email})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
            <textarea
              placeholder="Write your notification message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-300 p-4 rounded-xl h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Notification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Filters and Notifications List */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="text-blue-600 w-6 h-6" />
            <h2 className="text-2xl font-bold text-gray-900">My Notifications</h2>
          </div>
          
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="alert">Alert</option>
              <option value="task">Task</option>
              <option value="report">Report</option>
            </select>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filter.unreadOnly}
                onChange={(e) => setFilter(prev => ({ ...prev, unreadOnly: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Unread only</span>
            </label>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {sentNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No notifications found</p>
            </div>
          ) : (
            sentNotifications.map((n) => (
              <div
                key={n._id}
                className={`p-6 border rounded-xl shadow-sm transition-all duration-200 hover:shadow-md ${
                  n.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 rounded-lg ${getPriorityColor(n.priority)}`}>
                        {getTypeIcon(n.type)}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(n.priority)}`}>
                        {n.priority?.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                        {n.type?.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-900 font-medium mb-2">{n.message}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>From: {n.sender?.name} ({n.sender?.role})</span>
                      <span>•</span>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                      {n.receivers && n.receivers.length > 0 && (
                        <>
                          <span>•</span>
                          <span>To: {n.receivers.length} recipient(s)</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleReadStatus(n._id, n.isRead)}
                      className={`p-2 rounded-lg transition-colors ${
                        n.isRead 
                          ? 'text-gray-500 hover:bg-gray-200' 
                          : 'text-blue-600 hover:bg-blue-100'
                      }`}
                      title={n.isRead ? 'Mark as unread' : 'Mark as read'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => deleteNotification(n._id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationTab;