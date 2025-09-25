import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import { 
  FileText, Calendar, Send, Eye, Plus, Filter, 
  CheckCircle, Clock, AlertTriangle, Package
} from 'lucide-react';

// Reports Tab Component
export const ReportsTab = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [canSubmitDaily, setCanSubmitDaily] = useState(true);

  useEffect(() => {
    fetchReports();
    checkDailyReportStatus();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employee/reports');
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDailyReportStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayReports = reports.filter(report => 
        report.type === 'daily' && 
        new Date(report.createdAt).toISOString().split('T')[0] === today
      );
      setCanSubmitDaily(todayReports.length === 0);
    } catch (error) {
      console.error('Error checking daily report status:', error);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'submitted': 'bg-blue-100 text-blue-800 border-blue-200',
      'reviewed': 'bg-purple-100 text-purple-800 border-purple-200',
      'approved': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCompletionStatusColor = (status) => {
    const colors = {
      'complete': 'bg-green-100 text-green-800',
      'incomplete': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-gray-600 mt-1">Track your progress and submit reports</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!canSubmitDaily}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Submit Daily Report</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="daily">Daily Reports</option>
          <option value="monthly">Monthly Reports</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
          <p className="text-gray-600">
            {typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filter criteria.'
              : 'You haven\'t submitted any reports yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <ReportCard
              key={report._id}
              report={report}
              onViewDetails={(report) => setSelectedReport(report)}
              getStatusColor={getStatusColor}
              getCompletionStatusColor={getCompletionStatusColor}
            />
          ))}
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <CreateReportModal
          onClose={() => setShowCreateModal(false)}
          onReportCreated={() => {
            fetchReports();
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          getStatusColor={getStatusColor}
          getCompletionStatusColor={getCompletionStatusColor}
        />
      )}
    </div>
  );
};

// Report Card Component
const ReportCard = ({ report, onViewDetails, getStatusColor, getCompletionStatusColor }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 capitalize">
              {report.type} Report
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
              {report.status}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompletionStatusColor(report.completionStatus)}`}>
              {report.completionStatus}
            </span>
          </div>
        </div>

        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
          {report.content}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{report.tasksCompleted}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{report.tasksPending}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{report.feedbacks?.length || 0}</div>
            <div className="text-xs text-gray-500">Feedback</div>
          </div>
        </div>

        {report.projectStats && (
          <div className="border-t pt-4 mb-4">
            <div className="text-sm text-gray-600 mb-2">Project Stats:</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-semibold text-green-600">{report.projectStats.done}</div>
                <div className="text-gray-500">Done</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-600">{report.projectStats.inProgress}</div>
                <div className="text-gray-500">In Progress</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-600">{report.projectStats.selected}</div>
                <div className="text-gray-500">Total</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {report.createdBy?.name && `By ${report.createdBy.name}`}
          </div>
          <button
            onClick={() => onViewDetails(report)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            <Eye className="h-4 w-4" />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Create Report Modal Component
const CreateReportModal = ({ onClose, onReportCreated }) => {
  const [formData, setFormData] = useState({
    type: 'daily',
    content: '',
    tasksCompleted: 0,
    tasksPending: 0,
    projectStats: {
      done: 0,
      inProgress: 0,
      selected: 0
    }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      alert('Please provide report content');
      return;
    }

    try {
      setLoading(true);
      await api.post('/employee/reports/daily', formData);
      onReportCreated();
      alert('Report submitted successfully!');
    } catch (error) {
      console.error('Error creating report:', error);
      alert('Error submitting report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Submit Daily Report</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              placeholder="Describe what you accomplished today, challenges faced, and plans for tomorrow..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                value={formData.tasksCompleted}
                onChange={(e) => setFormData({...formData, tasksCompleted: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tasks Pending
              </label>
              <input
                type="number"
                min="0"
                value={formData.tasksPending}
                onChange={(e) => setFormData({...formData, tasksPending: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Statistics (Optional)
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <input
                  type="number"
                  min="0"
                  placeholder="Done"
                  value={formData.projectStats.done}
                  onChange={(e) => setFormData({
                    ...formData, 
                    projectStats: {...formData.projectStats, done: parseInt(e.target.value) || 0}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <label className="text-xs text-gray-500 mt-1">Done</label>
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  placeholder="In Progress"
                  value={formData.projectStats.inProgress}
                  onChange={(e) => setFormData({
                    ...formData, 
                    projectStats: {...formData.projectStats, inProgress: parseInt(e.target.value) || 0}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <label className="text-xs text-gray-500 mt-1">In Progress</label>
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  placeholder="Selected"
                  value={formData.projectStats.selected}
                  onChange={(e) => setFormData({
                    ...formData, 
                    projectStats: {...formData.projectStats, selected: parseInt(e.target.value) || 0}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <label className="text-xs text-gray-500 mt-1">Selected</label>
              </div>
            </div>
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
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Report Details Modal Component
const ReportDetailsModal = ({ report, onClose, getStatusColor, getCompletionStatusColor }) => {
  const Star = ({ filled }) => (
    <svg className={`h-4 w-4 ${filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">
                {report.type} Report
              </h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(report.status)}`}>
                  {report.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${getCompletionStatusColor(report.completionStatus)}`}>
                  {report.completionStatus}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
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
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Report Content</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 leading-relaxed">{report.content}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Task Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tasks Completed:</span>
                  <span className="font-medium text-green-600">{report.tasksCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tasks Pending:</span>
                  <span className="font-medium text-yellow-600">{report.tasksPending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tasks:</span>
                  <span className="font-medium text-gray-900">{report.tasksCompleted + report.tasksPending}</span>
                </div>
              </div>
            </div>

            {report.projectStats && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Projects Done:</span>
                    <span className="font-medium text-green-600">{report.projectStats.done}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Projects In Progress:</span>
                    <span className="font-medium text-blue-600">{report.projectStats.inProgress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Projects Selected:</span>
                    <span className="font-medium text-gray-600">{report.projectStats.selected}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {report.feedbacks && report.feedbacks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Feedback ({report.feedbacks.length})
              </h3>
              <div className="space-y-4">
                {report.feedbacks.map((feedback, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {feedback.givenBy?.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({feedback.role})
                        </span>
                        {feedback.rating && (
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                filled={star <= feedback.rating}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{feedback.comment}</p>
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

export default ReportsTab;