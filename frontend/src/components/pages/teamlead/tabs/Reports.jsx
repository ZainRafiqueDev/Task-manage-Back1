// src/pages/teamlead/tabs/Reports.jsx
import React, { useEffect, useState, useMemo } from "react";
import api from "../../../../services/api";
import { useAuth } from "../../../../context/AuthContext";
import {
  FileText,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  Trash2,
  Eye,
  Plus,
  MessageSquare,
  Send,
  Edit3,
  Calendar,
  User,
  TrendingUp,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(null); // Track which report is being submitted
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    search: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    reviewed: 0,
    approved: 0,
  });

  const [newReport, setNewReport] = useState({
    type: "daily",
    forUser: "",
    content: "",
    tasksCompleted: 0,
    tasksPending: 0,
    projectStats: {
      done: 0,
      inProgress: 0,
      selected: 0,
    },
  });

  const [editReport, setEditReport] = useState({
    content: "",
    tasksCompleted: 0,
    tasksPending: 0,
    projectStats: {
      done: 0,
      inProgress: 0,
      selected: 0,
    },
  });

  const [feedback, setFeedback] = useState({
    comment: "",
    rating: 3,
  });

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Fetch reports with pagination and filters
  const fetchReports = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...filters,
      });

      const response = await api.get(`/reports/me?${params}`);
      if (response.data.success) {
        setReports(response.data.reports);
        setCurrentPage(response.data.currentPage || 1);
        setTotalPages(response.data.totalPages || 1);
        calculateStats(response.data.reports);
      }
    } catch (err) {
      setError("Failed to load reports");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for assignment
  const fetchUsers = async () => {
    try {
      const response = await api.get("/reports/users");
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const calculateStats = (reportsData) => {
    setStats({
      total: reportsData.length,
      submitted: reportsData.filter((r) => r.status === "submitted").length,
      reviewed: reportsData.filter((r) => r.status === "reviewed").length,
      approved: reportsData.filter((r) => r.status === "approved").length,
    });
  };

  useEffect(() => {
    fetchReports(currentPage);
    fetchUsers();
  }, [currentPage, filters]);

  // Handle form submissions
  const handleCreateReport = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/reports", {
        ...newReport,
        tasksCompleted: parseInt(newReport.tasksCompleted) || 0,
        tasksPending: parseInt(newReport.tasksPending) || 0,
        projectStats: {
          done: parseInt(newReport.projectStats.done) || 0,
          inProgress: parseInt(newReport.projectStats.inProgress) || 0,
          selected: parseInt(newReport.projectStats.selected) || 0,
        },
      });

      if (response.data.success) {
        setSuccess("Report created successfully!");
        setShowCreateModal(false);
        resetNewReport();
        fetchReports(currentPage);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create report");
    }
  };

  const handleEditReport = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/reports/${selectedReport._id}`, {
        ...editReport,
        tasksCompleted: parseInt(editReport.tasksCompleted) || 0,
        tasksPending: parseInt(editReport.tasksPending) || 0,
        projectStats: {
          done: parseInt(editReport.projectStats.done) || 0,
          inProgress: parseInt(editReport.projectStats.inProgress) || 0,
          selected: parseInt(editReport.projectStats.selected) || 0,
        },
      });

      if (response.data.success) {
        setSuccess("Report updated successfully!");
        setShowEditModal(false);
        setSelectedReport(null);
        fetchReports(currentPage);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update report");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    
    try {
      const response = await api.delete(`/reports/${id}`);
      if (response.data.success) {
        setSuccess("Report deleted successfully!");
        fetchReports(currentPage);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete report");
    }
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/reports/${selectedReport._id}/feedback`, {
        comment: feedback.comment.trim(),
        rating: parseInt(feedback.rating),
      });

      if (response.data.success) {
        setSuccess("Feedback added successfully!");
        setFeedback({ comment: "", rating: 3 });
        setShowFeedbackModal(false);
        fetchReports(currentPage);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add feedback");
    }
  };

  // Updated handleSubmitToNext function using the new hierarchical route
  const handleSubmitToNext = async (reportId) => {
    try {
      setSubmitLoading(reportId); // Set loading state for this specific report
      
      // Use the new hierarchical submission route
      const response = await api.post(`/reports/${reportId}/submit-to-hierarchy`);

      if (response.data.success) {
        setSuccess(response.data.message);
        fetchReports(currentPage);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to submit report";
      setError(errorMessage);
      
      // Provide helpful guidance for common issues
      if (errorMessage.includes("No active admin found")) {
        setError("No admin users found in the system. Please contact your system administrator to create admin accounts.");
      } else if (errorMessage.includes("No active teamlead found")) {
        setError("No team lead users found in the system. Please contact your system administrator.");
      }
    } finally {
      setSubmitLoading(null); // Clear loading state
    }
  };

  const handleCompletionStatus = async (reportId, status) => {
    try {
      const response = await api.patch(`/reports/${reportId}/completion`, {
        completionStatus: status,
      });

      if (response.data.success) {
        setSuccess(`Report marked as ${status}!`);
        fetchReports(currentPage);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update completion status");
    }
  };

  // Helper functions
  const resetNewReport = () => {
    setNewReport({
      type: "daily",
      forUser: "",
      content: "",
      tasksCompleted: 0,
      tasksPending: 0,
      projectStats: { done: 0, inProgress: 0, selected: 0 },
    });
  };

  const openEditModal = (report) => {
    setSelectedReport(report);
    setEditReport({
      content: report.content,
      tasksCompleted: report.tasksCompleted,
      tasksPending: report.tasksPending,
      projectStats: report.projectStats || { done: 0, inProgress: 0, selected: 0 },
    });
    setShowEditModal(true);
  };

  const openFeedbackModal = (report) => {
    setSelectedReport(report);
    setShowFeedbackModal(true);
  };

  const openViewModal = (report) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  // Filter and search functionality
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      submitted: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      reviewed: { color: "bg-blue-100 text-blue-800", icon: Eye },
      approved: { color: "bg-green-100 text-green-800", icon: CheckCircle2 },
    };

    const config = statusConfig[status] || statusConfig.submitted;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Completion status badge
  const CompletionBadge = ({ status }) => {
    const statusConfig = {
      pending: { color: "bg-gray-100 text-gray-800", icon: Clock },
      complete: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      incomplete: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Render pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const showPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 text-sm rounded-lg ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <ClipboardList className="text-white" size={24} />
            </div>
            Reports Dashboard
          </h2>
          <p className="text-gray-600 mt-1">Manage and track your reports</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          Create Report
        </button>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-center">
            <XCircle className="text-red-500 mr-2" size={20} />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="text-green-500 mr-2" size={20} />
            <p className="text-green-700 font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Reports</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-xl">
              <FileText size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Submitted</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.submitted}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Reviewed</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.reviewed}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Eye className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.approved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-8 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="text-gray-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search reports..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  For User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <p className="mt-4 text-gray-500">Loading reports...</p>
                    </div>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-gray-400" />
                      <p className="mt-4 text-gray-500 text-lg">No reports found</p>
                      <p className="text-gray-400">Create your first report to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            report.type === "daily" ? "bg-blue-100" : "bg-purple-100"
                          }`}>
                            {report.type === "daily" ? (
                              <Calendar className={`h-5 w-5 ${report.type === "daily" ? "text-blue-600" : "text-purple-600"}`} />
                            ) : (
                              <BarChart3 className="h-5 w-5 text-purple-600" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {report.type} Report
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {report.forUser?.name || "—"}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {report.tasksCompleted}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            {report.tasksPending}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={report.status} />
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CompletionBadge status={report.completionStatus} />
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openViewModal(report)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="View Report"
                        >
                          <Eye size={16} />
                        </button>
                        
                        <button
                          onClick={() => openEditModal(report)}
                          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                          title="Edit Report"
                        >
                          <Edit3 size={16} />
                        </button>
                        
                        {(user.role === "teamlead" || user.role === "admin") && (
                          <button
                            onClick={() => openFeedbackModal(report)}
                            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                            title="Add Feedback"
                          >
                            <MessageSquare size={16} />
                          </button>
                        )}
                        
                        {/* Updated Submit Button with Loading State */}
                        <button
                          onClick={() => handleSubmitToNext(report._id)}
                          disabled={report.status === 'approved' || submitLoading === report._id}
                          className={`p-2 rounded-lg transition-colors duration-200 ${
                            report.status === 'approved' || submitLoading === report._id
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={
                            submitLoading === report._id
                              ? 'Submitting...'
                              : report.status === 'approved' 
                              ? 'Report already approved'
                              : user.role === 'employee' 
                                ? 'Submit to Team Lead'
                                : 'Submit to Admin'
                          }
                        >
                          {submitLoading === report._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                          ) : (
                            <Send size={16} />
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleDelete(report._id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete Report"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Plus className="text-blue-600" size={20} />
                Create New Report
              </h3>
            </div>
            
            <form onSubmit={handleCreateReport} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Type
                  </label>
                  <select
                    value={newReport.type}
                    onChange={(e) => setNewReport({ ...newReport, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="daily">Daily Report</option>
                    <option value="monthly">Monthly Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    For User (Optional)
                  </label>
                  <select
                    value={newReport.forUser}
                    onChange={(e) => setNewReport({ ...newReport, forUser: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {users
                      .filter((u) => u.role === "employee")
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Content *
                </label>
                <textarea
                  placeholder="Describe your work, achievements, and progress..."
                  value={newReport.content}
                  onChange={(e) => setNewReport({ ...newReport, content: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasks Completed
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newReport.tasksCompleted}
                    onChange={(e) => setNewReport({ ...newReport, tasksCompleted: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasks Pending
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newReport.tasksPending}
                    onChange={(e) => setNewReport({ ...newReport, tasksPending: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Statistics
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Done</label>
                    <input
                      type="number"
                      min="0"
                      value={newReport.projectStats.done}
                      onChange={(e) => setNewReport({
                        ...newReport,
                        projectStats: { ...newReport.projectStats, done: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">In Progress</label>
                    <input
                      type="number"
                      min="0"
                      value={newReport.projectStats.inProgress}
                      onChange={(e) => setNewReport({
                        ...newReport,
                        projectStats: { ...newReport.projectStats, inProgress: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Selected</label>
                    <input
                      type="number"
                      min="0"
                      value={newReport.projectStats.selected}
                      onChange={(e) => setNewReport({
                        ...newReport,
                        projectStats: { ...newReport.projectStats, selected: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetNewReport();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  Create Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Report Modal */}
      {showEditModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit3 className="text-indigo-600" size={20} />
                Edit Report
              </h3>
            </div>
            
            <form onSubmit={handleEditReport} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Content *
                </label>
                <textarea
                  value={editReport.content}
                  onChange={(e) => setEditReport({ ...editReport, content: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="4"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasks Completed
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editReport.tasksCompleted}
                    onChange={(e) => setEditReport({ ...editReport, tasksCompleted: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasks Pending
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editReport.tasksPending}
                    onChange={(e) => setEditReport({ ...editReport, tasksPending: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Statistics
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Done</label>
                    <input
                      type="number"
                      min="0"
                      value={editReport.projectStats.done}
                      onChange={(e) => setEditReport({
                        ...editReport,
                        projectStats: { ...editReport.projectStats, done: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">In Progress</label>
                    <input
                      type="number"
                      min="0"
                      value={editReport.projectStats.inProgress}
                      onChange={(e) => setEditReport({
                        ...editReport,
                        projectStats: { ...editReport.projectStats, inProgress: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Selected</label>
                    <input
                      type="number"
                      min="0"
                      value={editReport.projectStats.selected}
                      onChange={(e) => setEditReport({
                        ...editReport,
                        projectStats: { ...editReport.projectStats, selected: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedReport(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                >
                  Update Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {showViewModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Eye className="text-blue-600" size={20} />
                View Report Details
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Report Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Report Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{selectedReport.type} Report</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedReport.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <StatusBadge status={selectedReport.status} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completion:</span>
                      <CompletionBadge status={selectedReport.completionStatus} />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Task Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600">Completed</span>
                      </div>
                      <span className="font-bold text-green-600">{selectedReport.tasksCompleted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-gray-600">Pending</span>
                      </div>
                      <span className="font-bold text-yellow-600">{selectedReport.tasksPending}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Statistics */}
              {selectedReport.projectStats && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Project Statistics
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedReport.projectStats.done || 0}</div>
                      <div className="text-sm text-gray-600">Done</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{selectedReport.projectStats.inProgress || 0}</div>
                      <div className="text-sm text-gray-600">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedReport.projectStats.selected || 0}</div>
                      <div className="text-sm text-gray-600">Selected</div>
                    </div>
                  </div>
                </div>
              )}

              {/* For User Info */}
              {selectedReport.forUser && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    Assigned Employee
                  </h4>
                  <div className="text-sm">
                    <div className="font-medium">{selectedReport.forUser.name}</div>
                    <div className="text-gray-600">{selectedReport.forUser.email}</div>
                  </div>
                </div>
              )}

              {/* Report Content */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Report Content</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.content}</p>
                </div>
              </div>

              {/* Submission History */}
              {selectedReport.submissionHistory && selectedReport.submissionHistory.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Send className="h-5 w-5 text-blue-600" />
                    Submission History
                  </h4>
                  <div className="space-y-3">
                    {selectedReport.submissionHistory.map((submission, index) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-blue-900">
                              {submission.submittedBy?.name || 'Unknown User'}
                            </span>
                            <span className="text-sm text-blue-700">
                              ({submission.fromRole} → {submission.toRole})
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {submission.submittedTo && submission.submittedTo.length > 0 && (
                          <p className="text-blue-800 text-sm">
                            Submitted to: {submission.submittedTo.map(user => user.name || user).join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Section */}
              {selectedReport.feedbacks && selectedReport.feedbacks.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    Feedback
                  </h4>
                  <div className="space-y-3">
                    {selectedReport.feedbacks.map((fb, index) => (
                      <div key={index} className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-purple-900">{fb.givenBy?.name || 'Anonymous'}</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={`${
                                    i < fb.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(fb.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-purple-800">{fb.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion Status Controls */}
              {(user.role === "teamlead" || user.role === "admin") && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Update Completion Status</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCompletionStatus(selectedReport._id, 'complete')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Mark Complete
                    </button>
                    <button
                      onClick={() => handleCompletionStatus(selectedReport._id, 'incomplete')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      Mark Incomplete
                    </button>
                    <button
                      onClick={() => handleCompletionStatus(selectedReport._id, 'pending')}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
                    >
                      <Clock size={16} />
                      Mark Pending
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedReport(null);
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="text-purple-600" size={20} />
                Add Feedback
              </h3>
            </div>
            
            <form onSubmit={handleFeedback} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFeedback({ ...feedback, rating })}
                      className="p-1"
                    >
                      <Star
                        size={24}
                        className={`${
                          rating <= feedback.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 hover:text-yellow-200'
                        } transition-colors duration-200`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">({feedback.rating}/5)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment *
                </label>
                <textarea
                  value={feedback.comment}
                  onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="4"
                  placeholder="Share your feedback on this report..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedReport(null);
                    setFeedback({ comment: "", rating: 3 });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;