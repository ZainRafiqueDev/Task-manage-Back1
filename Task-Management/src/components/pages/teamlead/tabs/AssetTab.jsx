import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  RefreshCw,
  RotateCcw,
  Clock,
  Eye,
  XCircle,
  CircleDot,
} from "lucide-react";
import api from "../../../../services/api"; // adjust path if needed
import { useAuth } from "../../../../context/AuthContext";

const TeamLeadAssetsTab = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAssetHistory, setSelectedAssetHistory] = useState(null);
  const [error, setError] = useState("");

  // ✅ Fetch TeamLead's assets
  const fetchMyAssets = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/assets/my/assets");
      setAssets(res.data.data || []);
    } catch (err) {
      console.error("❌ Error fetching my assets:", err);
      setError(err.response?.data?.message || "Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAssets();
  }, []);

  // ✅ Handle return asset
  const handleReturn = async (assetId) => {
    if (!window.confirm("Are you sure you want to return this asset?")) return;

    try {
      setLoading(true);
      await api.put(`/assets/return/${assetId}`);
      alert("✅ Asset returned successfully");
      fetchMyAssets(); // refresh list
    } catch (err) {
      console.error("❌ Error returning asset:", err);
      alert(err.response?.data?.message || "Failed to return asset");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Search assets
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchMyAssets();
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/assets/search?q=${searchQuery}`);
      setAssets(res.data.data || []);
    } catch (err) {
      console.error("❌ Error searching assets:", err);
      alert("Failed to search assets");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch asset history
  const viewHistory = async (assetId) => {
    try {
      setLoading(true);
      const res = await api.get(`/assets/${assetId}/history`);
      setSelectedAssetHistory(res.data.history || []);
    } catch (err) {
      console.error("❌ Error fetching history:", err);
      alert("Failed to fetch asset history");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          My Assets
        </h2>
        <button
          onClick={fetchMyAssets}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by name, serial, type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Assets List */}
      {!loading && assets.length === 0 && (
        <p className="text-gray-600">No assets found</p>
      )}

      <div className="grid gap-4">
        {assets.map((asset) => (
          <div
            key={asset._id}
            className="p-4 border rounded-lg shadow-sm flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold">{asset.name}</h3>
              <p className="text-sm text-gray-600">
                Serial: {asset.serialNumber}
              </p>
              <p className="text-sm text-gray-600">Type: {asset.type}</p>
              <p className="text-sm text-gray-600">
                Condition: {asset.conditionStatus}
              </p>
              {asset.assignmentDate && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Assigned on:{" "}
                  {new Date(asset.assignmentDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => viewHistory(asset._id)}
                className="flex items-center gap-1 px-3 py-1 border rounded hover:bg-gray-100"
              >
                <Eye className="w-4 h-4" /> History
              </button>
              <button
                onClick={() => handleReturn(asset._id)}
                className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                <RotateCcw className="w-4 h-4" /> Return
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Asset History Modal with Timeline */}
      {selectedAssetHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[600px] relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setSelectedAssetHistory(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> Asset History
            </h3>

            {selectedAssetHistory.length === 0 ? (
              <p className="text-gray-500">No history available</p>
            ) : (
              <div className="space-y-6">
                {selectedAssetHistory.map((h, i) => (
                  <div key={i} className="relative pl-8 border-l-2 border-gray-300">
                    <span className="absolute -left-[10px] top-0 bg-blue-600 text-white rounded-full p-1">
                      <CircleDot className="w-3 h-3" />
                    </span>
                    <p className="font-semibold">{h.action || "Action"}</p>
                    <p className="text-sm text-gray-600">
                      By: {h.user?.name || "Unknown User"}
                    </p>
                    {h.notes && (
                      <p className="text-sm text-gray-500 italic">“{h.notes}”</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(h.timestamp || h.date).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamLeadAssetsTab;
