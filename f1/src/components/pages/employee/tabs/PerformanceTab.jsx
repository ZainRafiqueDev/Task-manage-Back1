import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import { 
  TrendingUp, Star, Clock, CheckCircle, Target, 
  Calendar, Award, MessageSquare, BarChart3, 
  Filter, Eye, ChevronDown, ChevronUp, X
} from 'lucide-react';

const PerformanceTab = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    fetchPerformanceData();
  }, [timeframe]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/employee/performance?timeframe=${timeframe}`);
      setPerformanceData(response.data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4) return 'text-blue-600';
    if (rating >= 3) return 'text-yellow-600';
    if (rating >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceLevel = (rating) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4) return 'Good';
    if (rating >= 3) return 'Average';
    if (rating >= 2) return 'Below Average';
    return 'Needs Improvement';
  };

  const getCompletionRateColor = (rate) => {
    if (rate >= 90) return 'text-green-600 bg-green-100';
    if (rate >= 75) return 'text-blue-600 bg-blue-100';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const metrics = performanceData?.metrics || {};
  const reports = performanceData?.reports || [];
  const recentFeedback = performanceData?.recentFeedback || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Overview</h2>
          <p className="text-gray-600 mt-1">
            Your performance metrics for the last {timeframe} days
          </p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 3 months</option>
          <option value="180">Last 6 months</option>
        </select>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Task Completion Rate"
          value={`${metrics.completionRate || 0}%`}
          subtitle={`${metrics.completedTasks}/${metrics.totalTasks} tasks`}
          icon={CheckCircle}
          color={getCompletionRateColor(metrics.completionRate || 0)}
          trend={metrics.completionRate >= 80 ? 'up' : 'down'}
        />
        
        <MetricCard
          title="Average Rating"
          value={metrics.averageRating || 'N/A'}
          subtitle={getPerformanceLevel(parseFloat(metrics.averageRating) || 0)}
          icon={Star}
          color={getRatingColor(parseFloat(metrics.averageRating) || 0)}
          showStars={true}
          rating={parseFloat(metrics.averageRating) || 0}
        />
        
        <MetricCard
          title="Hours Logged"
          value={`${metrics.totalHoursLogged || 0}h`}
          subtitle="Total time tracked"
          icon={Clock}
          color="text-purple-600 bg-purple-100"
        />
        
        <MetricCard
          title="On-Time Delivery"
          value={`${metrics.onTimeRate || 0}%`}
          subtitle="Tasks completed on time"
          icon={Target}
          color={getCompletionRateColor(metrics.onTimeRate || 0)}
          trend={metrics.onTimeRate >= 75 ? 'up' : 'down'}
        />
      </div>

      {/* Performance Chart */}
      {metrics.totalTasks > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
          <TaskStatusChart metrics={metrics} />
        </div>
      )}

      {/* Recent Feedback */}
      {recentFeedback.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Feedback ({recentFeedback.length})
          </h3>
          <div className="space-y-4">
            {recentFeedback.slice(0, 5).map((feedback, index) => (
              <FeedbackCard
                key={index}
                feedback={feedback}
                onViewDetails={() => setSelectedFeedback(feedback)}
              />
            ))}
          </div>
          {recentFeedback.length > 5 && (
            <button className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All Feedback ({recentFeedback.length})
            </button>
          )}
        </div>
      )}

      {/* Performance Reports */}
      {reports.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Reports ({reports.length})
          </h3>
          <div className="space-y-4">
            {reports.slice(0, 3).map((report) => (
              <ReportCard key={report._id} report={report} />
            ))}
          </div>
          {reports.length > 3 && (
            <button className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All Reports ({reports.length})
            </button>
          )}
        </div>
      )}

      {/* Performance Tips */}
      <PerformanceTips metrics={metrics} />

      {/* Feedback Details Modal */}
      {selectedFeedback && (
        <FeedbackModal
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
        />
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend, showStars, rating }) => {
  const trendIcon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '';
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
        </div>
        {trend && (
          <span className={`text-lg ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trendIcon}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="flex items-end space-x-2">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {showStars && rating > 0 && (
            <div className="flex items-center mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
      </div>
    </div>
  );
};

// Task Status Chart Component
const TaskStatusChart = ({ metrics }) => {
  const data = [
    { label: 'Completed', value: metrics.completed || 0, color: 'bg-green-500' },
    { label: 'In Progress', value: metrics.inProgress || 0, color: 'bg-blue-500' },
    { label: 'Pending', value: metrics.pending || 0, color: 'bg-yellow-500' },
    { label: 'Blocked', value: metrics.blocked || 0, color: 'bg-red-500' }
  ].filter(item => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No task data available for the selected timeframe.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bars */}
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <div className="flex-1 mx-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${(item.value / total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              <span className="text-xs text-gray-500">
                ({Math.round((item.value / total) * 100)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Feedback Card Component
const FeedbackCard = ({ feedback, onViewDetails }) => {
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">
            {feedback.givenBy?.name || 'Anonymous'}
          </span>
          <span className="text-sm text-gray-500">
            ({feedback.givenBy?.role || 'Unknown'})
          </span>
          {feedback.rating && (
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= feedback.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {new Date(feedback.createdAt).toLocaleDateString()}
          </span>
          <button
            onClick={onViewDetails}
            className="text-blue-600 hover:text-blue-800 text-xs"
          >
            <Eye className="h-3 w-3" />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-700 line-clamp-2">{feedback.comment}</p>
    </div>
  );
};

// Report Card Component
const ReportCard = ({ report }) => {
  const getStatusColor = (status) => {
    const colors = {
      'submitted': 'bg-blue-100 text-blue-800',
      'reviewed': 'bg-purple-100 text-purple-800',
      'approved': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-sm font-medium text-gray-900 capitalize">
            {report.type} Report
          </span>
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
            {report.status}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(report.createdAt).toLocaleDateString()}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
        <div className="text-center">
          <div className="font-semibold text-gray-900">{report.tasksCompleted || 0}</div>
          <div className="text-gray-500 text-xs">Completed</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900">{report.tasksPending || 0}</div>
          <div className="text-gray-500 text-xs">Pending</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900">{report.feedbacks?.length || 0}</div>
          <div className="text-gray-500 text-xs">Feedback</div>
        </div>
      </div>
      
      {report.feedbacks && report.feedbacks.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="text-xs text-gray-600 mb-1">Latest Feedback:</div>
          <p className="text-sm text-gray-700 line-clamp-2">
            {report.feedbacks[report.feedbacks.length - 1].comment}
          </p>
        </div>
      )}
    </div>
  );
};

// Performance Tips Component
const PerformanceTips = ({ metrics }) => {
  const tips = [];
  
  if (metrics.completionRate < 80) {
    tips.push({
      title: "Improve Task Completion Rate",
      description: "Focus on completing tasks within deadlines. Consider breaking large tasks into smaller, manageable chunks.",
      icon: Target,
      color: "text-orange-600"
    });
  }
  
  if (metrics.onTimeRate < 75) {
    tips.push({
      title: "Better Time Management",
      description: "Plan your tasks better and set realistic deadlines. Use time tracking to understand how long tasks actually take.",
      icon: Clock,
      color: "text-blue-600"
    });
  }
  
  if (metrics.feedbackCount < 3) {
    tips.push({
      title: "Seek More Feedback",
      description: "Regularly communicate with your team lead about your progress and ask for feedback to improve continuously.",
      icon: MessageSquare,
      color: "text-purple-600"
    });
  }

  if (tips.length === 0) {
    tips.push({
      title: "Keep Up the Great Work!",
      description: "Your performance metrics look good. Continue maintaining quality work and regular communication with your team.",
      icon: Award,
      color: "text-green-600"
    });
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <span>Performance Insights</span>
      </h3>
      
      <div className="space-y-4">
        {tips.map((tip, index) => {
          const Icon = tip.icon;
          return (
            <div key={index} className="flex items-start space-x-3 bg-white rounded-lg p-4">
              <Icon className={`h-5 w-5 mt-0.5 ${tip.color}`} />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{tip.title}</h4>
                <p className="text-sm text-gray-700">{tip.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Feedback Modal Component
const FeedbackModal = ({ feedback, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Feedback Details</h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-600">
                  From: {feedback.givenBy?.name} ({feedback.givenBy?.role})
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(feedback.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {feedback.rating && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= feedback.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {feedback.rating}/5
                </span>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments
            </label>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 leading-relaxed">{feedback.comment}</p>
            </div>
          </div>

          {feedback.category && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                {feedback.category}
              </span>
            </div>
          )}

          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suggestions for Improvement
              </label>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {feedback.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceTab;