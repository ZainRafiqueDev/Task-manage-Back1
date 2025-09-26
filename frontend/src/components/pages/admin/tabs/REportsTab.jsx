// src/components/admin/tabs/ReportsTab.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../services/api";

const ReportsTab = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    completionStatus: "",
    from: "",
    to: ""
  });

  // Form state for new report
  const [newReport, setNewReport] = useState({
    type: "daily",
    forUser: "",
    content: "",
    tasksCompleted: 0,
    tasksPending: 0,
    projectStats: {
      done: 0,
      inProgress: 0,
      selected: 0
    }
  });

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    comment: "",
    rating: 5
  });

  // Edit report state
  const [editingReport, setEditingReport] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchReports();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Try multiple endpoints for fetching users
      let response;
      try {
        response = await api.get("/admin/users");
      } catch (err) {
        console.log('Admin users endpoint failed, trying reports/users:', err);
        response = await api.get("/reports/users");
      }
      
      const userData = response.data.users || response.data.data || response.data || [];
      setUsers(Array.isArray(userData) ? userData : []);
      console.log('Users fetched:', userData.length);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to fetch users");
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Build query string for filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      // Try multiple endpoints for fetching reports
      let response;
      const queryString = queryParams.toString();
      
      try {
        response = await api.get(`/admin/reports${queryString ? '?' + queryString : ''}`);
      } catch (err) {
        console.log('Admin reports endpoint failed, trying reports/admin:', err);
        response = await api.get(`/reports/admin${queryString ? '?' + queryString : ''}`);
      }

      const reportsData = response.data.reports || response.data.data || response.data || [];
      
      // Ensure each report has proper structure and handle missing nested properties
      const processedReports = Array.isArray(reportsData) ? reportsData.map(report => ({
        ...report,
        createdBy: report.createdBy || { name: 'Unknown', role: 'unknown' },
        forUser: report.forUser || null,
        projectStats: report.projectStats || { done: 0, inProgress: 0, selected: 0 },
        feedbacks: Array.isArray(report.feedbacks) ? report.feedbacks : [],
        tasksCompleted: report.tasksCompleted || 0,
        tasksPending: report.tasksPending || 0,
        status: report.status || 'submitted',
        completionStatus: report.completionStatus || 'pending'
      })) : [];

      setReports(processedReports);
      console.log('Reports processed:', processedReports.length);
      
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReports = async (userId) => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/user/${userId}`);
      const reportsData = response.data.reports || response.data.data || [];
      
      // Process user reports with same safety checks
      const processedReports = Array.isArray(reportsData) ? reportsData.map(report => ({
        ...report,
        createdBy: report.createdBy || { name: 'Unknown', role: 'unknown' },
        forUser: report.forUser || null,
        projectStats: report.projectStats || { done: 0, inProgress: 0, selected: 0 },
        feedbacks: Array.isArray(report.feedbacks) ? report.feedbacks : []
      })) : [];

      setReports(processedReports);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch user reports");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    try {
      const reportData = {
        ...newReport,
        tasksCompleted: parseInt(newReport.tasksCompleted) || 0,
        tasksPending: parseInt(newReport.tasksPending) || 0,
        projectStats: {
          done: parseInt(newReport.projectStats.done) || 0,
          inProgress: parseInt(newReport.projectStats.inProgress) || 0,
          selected: parseInt(newReport.projectStats.selected) || 0
        }
      };

      await api.post("/reports", reportData);
      
      setNewReport({
        type: "daily",
        forUser: "",
        content: "",
        tasksCompleted: 0,
        tasksPending: 0,
        projectStats: { done: 0, inProgress: 0, selected: 0 }
      });
      
      fetchReports();
      alert('Report created successfully!');
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create report");
    }
  };

  const handleUpdateReport = async (reportId, updateData) => {
    try {
      await api.put(`/reports/${reportId}`, updateData);
      setEditingReport(null);
      setEditForm({});
      fetchReports();
      alert('Report updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update report");
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    
    try {
      await api.delete(`/reports/${reportId}`);
      fetchReports();
      alert('Report deleted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete report");
    }
  };

  const handleAddFeedback = async (reportId) => {
    try {
      await api.post(`/reports/${reportId}/feedback`, feedbackForm);
      setFeedbackForm({ comment: "", rating: 5 });
      setSelectedReport(null);
      fetchReports();
      alert('Feedback added successfully!');
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add feedback");
    }
  };

  const handleUpdateCompletionStatus = async (reportId, completionStatus) => {
    try {
      await api.patch(`/reports/${reportId}/completion`, { completionStatus });
      fetchReports();
      alert(`Report marked as ${completionStatus}!`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update completion status");
    }
  };

  const startEditing = (report) => {
    setEditingReport(report._id);
    setEditForm({
      type: report.type || 'daily',
      content: report.content || '',
      tasksCompleted: report.tasksCompleted || 0,
      tasksPending: report.tasksPending || 0,
      projectStats: { 
        done: report.projectStats?.done || 0,
        inProgress: report.projectStats?.inProgress || 0,
        selected: report.projectStats?.selected || 0
      }
    });
  };

  const cancelEditing = () => {
    setEditingReport(null);
    setEditForm({});
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Reports Management</h2>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
        <p><strong>Debug Info:</strong></p>
        <p>Reports loaded: {reports.length}</p>
        <p>Users loaded: {users.length}</p>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="">All Types</option>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="approved">Approved</option>
          </select>

          <select
            value={filters.completionStatus}
            onChange={(e) => setFilters({ ...filters, completionStatus: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="">All Completion</option>
            <option value="pending">Pending</option>
            <option value="complete">Complete</option>
            <option value="incomplete">Incomplete</option>
          </select>

          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="border p-2 rounded"
            placeholder="From Date"
          />

          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="border p-2 rounded"
            placeholder="To Date"
          />
        </div>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={fetchReports}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setFilters({ type: "", status: "", completionStatus: "", from: "", to: "" });
              fetchReports();
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* User Reports Section */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-3">View User Reports</h3>
        <div className="flex gap-2">
          <select
            onChange={(e) => e.target.value && fetchUserReports(e.target.value)}
            className="border p-2 rounded flex-1"
          >
            <option value="">Select a user to view their reports</option>
            {users.map(user => (
              <option key={user._id || user.id} value={user._id || user.id}>
                {user.name || 'Unknown'} ({user.role || 'unknown'})
              </option>
            ))}
          </select>
          <button
            onClick={fetchReports}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            View All Reports
          </button>
        </div>
      </div>

      {/* Create Report Form */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-3">Create New Report</h3>
        <form onSubmit={handleCreateReport} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={newReport.type}
              onChange={(e) => setNewReport({ ...newReport, type: e.target.value })}
              className="border p-2 rounded"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>

            <select
              value={newReport.forUser}
              onChange={(e) => setNewReport({ ...newReport, forUser: e.target.value })}
              className="border p-2 rounded"
            >
              <option value="">Select User (Optional)</option>
              {users.map(user => (
                <option key={user._id || user.id} value={user._id || user.id}>
                  {user.name || 'Unknown'} ({user.role || 'unknown'})
                </option>
              ))}
            </select>
          </div>

          <textarea
            placeholder="Report content"
            value={newReport.content}
            onChange={(e) => setNewReport({ ...newReport, content: e.target.value })}
            className="border p-2 rounded w-full h-32"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Tasks Completed"
              value={newReport.tasksCompleted}
              onChange={(e) => setNewReport({ ...newReport, tasksCompleted: e.target.value })}
              className="border p-2 rounded"
              min="0"
            />
            <input
              type="number"
              placeholder="Tasks Pending"
              value={newReport.tasksPending}
              onChange={(e) => setNewReport({ ...newReport, tasksPending: e.target.value })}
              className="border p-2 rounded"
              min="0"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="number"
              placeholder="Projects Done"
              value={newReport.projectStats.done}
              onChange={(e) => setNewReport({
                ...newReport,
                projectStats: { ...newReport.projectStats, done: e.target.value }
              })}
              className="border p-2 rounded"
              min="0"
            />
            <input
              type="number"
              placeholder="Projects In Progress"
              value={newReport.projectStats.inProgress}
              onChange={(e) => setNewReport({
                ...newReport,
                projectStats: { ...newReport.projectStats, inProgress: e.target.value }
              })}
              className="border p-2 rounded"
              min="0"
            />
            <input
              type="number"
              placeholder="Projects Selected"
              value={newReport.projectStats.selected}
              onChange={(e) => setNewReport({
                ...newReport,
                projectStats: { ...newReport.projectStats, selected: e.target.value }
              })}
              className="border p-2 rounded"
              min="0"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Create Report
          </button>
        </form>
      </div>

      {/* Reports List */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-3">All Reports ({reports.length})</h3>
        
        {loading && <p className="text-center py-4">Loading reports...</p>}

        {!loading && reports.length === 0 && (
          <p className="text-gray-500 text-center py-4">No reports found.</p>
        )}

        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report._id || report.id} className="border rounded-lg p-4 bg-gray-50">
              {/* Report Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-lg">
                    {(report.type || 'unknown').toUpperCase()} Report
                    {report.forUser && (
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        for {report.forUser.name || 'Unknown User'}
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Created by: {report.createdBy?.name || 'Unknown'} ({report.createdBy?.role || 'unknown'})
                  </p>
                  <p className="text-xs text-gray-500">
                    {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'Date unknown'}
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  {/* Status Badges */}
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      report.status === "approved" ? "bg-green-100 text-green-600" :
                      report.status === "reviewed" ? "bg-yellow-100 text-yellow-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      {report.status || 'submitted'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      report.completionStatus === "complete" ? "bg-green-100 text-green-600" :
                      report.completionStatus === "incomplete" ? "bg-red-100 text-red-600" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {report.completionStatus || 'pending'}
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditing(report)}
                      className="bg-blue-500 text-white px-2 py-1 text-xs rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report._id || report.id)}
                      className="bg-red-500 text-white px-2 py-1 text-xs rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="bg-green-500 text-white px-2 py-1 text-xs rounded hover:bg-green-600"
                    >
                      Feedback
                    </button>
                  </div>
                </div>
              </div>

              {/* Report Content */}
              {editingReport === (report._id || report.id) ? (
                <div className="space-y-3">
                  <textarea
                    value={editForm.content || ''}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    className="border p-2 rounded w-full h-24"
                  />
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <input
                      type="number"
                      value={editForm.tasksCompleted || 0}
                      onChange={(e) => setEditForm({ ...editForm, tasksCompleted: e.target.value })}
                      className="border p-2 rounded text-sm"
                      placeholder="Tasks Completed"
                    />
                    <input
                      type="number"
                      value={editForm.tasksPending || 0}
                      onChange={(e) => setEditForm({ ...editForm, tasksPending: e.target.value })}
                      className="border p-2 rounded text-sm"
                      placeholder="Tasks Pending"
                    />
                    <input
                      type="number"
                      value={editForm.projectStats?.done || 0}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        projectStats: { ...editForm.projectStats, done: e.target.value }
                      })}
                      className="border p-2 rounded text-sm"
                      placeholder="Done"
                    />
                    <input
                      type="number"
                      value={editForm.projectStats?.inProgress || 0}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        projectStats: { ...editForm.projectStats, inProgress: e.target.value }
                      })}
                      className="border p-2 rounded text-sm"
                      placeholder="In Progress"
                    />
                    <input
                      type="number"
                      value={editForm.projectStats?.selected || 0}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        projectStats: { ...editForm.projectStats, selected: e.target.value }
                      })}
                      className="border p-2 rounded text-sm"
                      placeholder="Selected"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateReport(report._id || report.id, editForm)}
                      className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="bg-gray-500 text-white px-3 py-1 text-sm rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-3">{report.content || 'No content'}</p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-600 mb-3">
                    <div>Completed: {report.tasksCompleted || 0}</div>
                    <div>Pending: {report.tasksPending || 0}</div>
                    <div>Done: {report.projectStats?.done || 0}</div>
                    <div>In Progress: {report.projectStats?.inProgress || 0}</div>
                    <div>Selected: {report.projectStats?.selected || 0}</div>
                  </div>
                </>
              )}

              {/* Completion Status Controls */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleUpdateCompletionStatus(report._id || report.id, "complete")}
                  className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600"
                  disabled={report.completionStatus === "complete"}
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => handleUpdateCompletionStatus(report._id || report.id, "incomplete")}
                  className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600"
                  disabled={report.completionStatus === "incomplete"}
                >
                  Mark Incomplete
                </button>
              </div>

              {/* Existing Feedbacks */}
              {report.feedbacks && report.feedbacks.length > 0 && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <h5 className="font-semibold mb-2">Feedbacks:</h5>
                  {report.feedbacks.map((feedback, index) => (
                    <div key={index} className="mb-2 p-2 bg-gray-50 rounded text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{(feedback.role || 'unknown').toUpperCase()}</span>
                        {feedback.rating && (
                          <span className="text-yellow-500">
                            {"★".repeat(feedback.rating)}{"☆".repeat(5-feedback.rating)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1">{feedback.comment || 'No comment'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {feedback.createdAt ? new Date(feedback.createdAt).toLocaleString() : 'Date unknown'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Add Feedback to {(selectedReport.type || 'unknown')} Report
            </h3>
            
            <textarea
              placeholder="Your feedback comment..."
              value={feedbackForm.comment}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
              className="border p-3 rounded w-full h-32 mb-4"
              required
            />
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Rating (Optional):</label>
              <select
                value={feedbackForm.rating}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, rating: e.target.value })}
                className="border p-2 rounded w-full"
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Below Average</option>
                <option value="1">1 - Poor</option>
              </select>
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddFeedback(selectedReport._id || selectedReport.id)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={!feedbackForm.comment.trim()}
              >
                Add Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsTab;