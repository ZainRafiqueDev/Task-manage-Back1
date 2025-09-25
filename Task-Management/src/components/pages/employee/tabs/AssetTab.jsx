import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import { 
  Package, Laptop, Monitor, Mouse, Headphones,
  Keyboard, Zap, Briefcase, RotateCcw, Eye, Clock, XCircle, CircleDot
} from 'lucide-react';

// Assets Tab Component
export const AssetsTab = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]); // ✅ Asset history state
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/assets/my/assets');
      const assetsData = response.data.assets || response.data.data || response.data || [];
      setAssets(Array.isArray(assetsData) ? assetsData : []);

    } catch (error) {
      console.error('💥 Error in fetchAssets:', error);
      setError(error.response?.data?.message || 'Failed to fetch assets');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch asset history
  const viewHistory = async (assetId) => {
    try {
      setLoading(true);
      const res = await api.get(`/assets/${assetId}/history`);
      setHistory(res.data.history || []);
      setShowHistory(true);
    } catch (err) {
      console.error("❌ Error fetching history:", err);
      alert("Failed to fetch asset history");
    } finally {
      setLoading(false);
    }
  };

  const requestReturn = async (assetId, reason, notes) => {
    try {
      setError(null);
      await api.post(`/assets/${assetId}/request-return`, { reason, notes });
      fetchAssets();
      alert('Return request submitted successfully!');
    } catch (error) {
      console.error('Error requesting return:', error);
      const errorMessage = error.response?.data?.message || 'Error submitting return request';
      alert(errorMessage);
      setError(errorMessage);
    }
  };

  const getAssetIcon = (type) => {
    const icons = {
      'laptop': Laptop,
      'imac': Monitor,
      'mouse': Mouse,
      'keyboard': Keyboard,
      'headphone': Headphones,
      'charger': Zap,
      'bag': Briefcase
    };
    return icons[type] || Package;
  };

  const getConditionColor = (condition) => {
    const colors = {
      'good': 'bg-green-100 text-green-800',
      'bad': 'bg-red-100 text-red-800',
      'repair': 'bg-yellow-100 text-yellow-800',
      'broken': 'bg-red-100 text-red-800'
    };
    return colors[condition] || 'bg-gray-100 text-gray-800';
  };

  const getReturnStatusColor = (status) => {
    const colors = {
      'none': 'bg-gray-100 text-gray-800',
      'requested': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'returned': 'bg-blue-100 text-blue-800'
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
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-800">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Assets</h2>
          <p className="text-gray-600 mt-1">Assets currently assigned to you</p>
        </div>
        <div className="text-sm text-gray-600">
          Total Assets: {assets.length}
        </div>
      </div>

      {/* Assets Grid */}
      {assets.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Assets Assigned</h3>
          <p className="text-gray-600">You currently have no assets assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <AssetCard
              key={asset._id || asset.id}
              asset={asset}
              onRequestReturn={(asset) => {
                setSelectedAsset(asset);
                setShowReturnModal(true);
              }}
              onViewHistory={() => viewHistory(asset._id)} // ✅ Added
              getAssetIcon={getAssetIcon}
              getConditionColor={getConditionColor}
              getReturnStatusColor={getReturnStatusColor}
            />
          ))}
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && selectedAsset && (
        <ReturnRequestModal
          asset={selectedAsset}
          onClose={() => {
            setShowReturnModal(false);
            setSelectedAsset(null);
          }}
          onSubmit={(reason, notes) => {
            requestReturn(selectedAsset._id || selectedAsset.id, reason, notes);
            setShowReturnModal(false);
            setSelectedAsset(null);
          }}
        />
      )}

      {/* ✅ History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] relative">
            <button
              onClick={() => setShowHistory(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> Asset History
            </h3>
            {history.length === 0 ? (
              <p className="text-gray-500">No history available</p>
            ) : (
              <ul className="space-y-4">
                {history.map((h, i) => (
                  <li key={i} className="relative pl-6 border-l-2 border-gray-200">
                    <span className="absolute -left-2 top-1.5 w-3 h-3 rounded-full bg-blue-500"></span>
                    <div className="flex justify-between">
                      <span className="font-medium">{h.user?.name || "Unknown User"}</span>
                      <span className="text-xs text-gray-600">
                        {new Date(h.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{h.action || "Updated asset"}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Asset Card Component
const AssetCard = ({ asset, onRequestReturn, onViewHistory, getAssetIcon, getConditionColor, getReturnStatusColor }) => {
  const Icon = getAssetIcon(asset.type);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{asset.name}</h3>
              <p className="text-sm text-gray-600 capitalize">{asset.type}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(asset.conditionStatus)}`}>
            {asset.conditionStatus}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={onViewHistory}
            className="flex items-center gap-1 px-3 py-1 border rounded hover:bg-gray-100 text-sm"
          >
            <Eye className="w-4 h-4" /> History
          </button>
          {(!asset.returnStatus || asset.returnStatus === 'none') && (
            <button
              onClick={() => onRequestReturn(asset)}
              className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded hover:bg-orange-200 text-sm"
            >
              <RotateCcw className="w-4 h-4" /> Request Return
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Return Request Modal Component
const ReturnRequestModal = ({ asset, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for return');
      return;
    }
    onSubmit(reason, notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Request Asset Return</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">Asset: <span className="font-medium">{asset.name}</span></p>
            <p className="text-sm text-gray-600">Serial: <span className="font-medium">{asset.serialNumber}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Return *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a reason...</option>
              <option value="project-completion">Project Completion</option>
              <option value="equipment-upgrade">Equipment Upgrade</option>
              <option value="technical-issues">Technical Issues</option>
              <option value="job-change">Job Role Change</option>
              <option value="personal-device">Using Personal Device</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information about the return request..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetsTab;
