import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Package, Search, Filter } from 'lucide-react';
import api from '../../../../services/api';

const AdminAssetTab = () => {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create', 'edit', 'assign'
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    brand: '',
    model: '',
    serialNumber: '',
    specification: '',
    processor: '',
    ram: '',
    rom: '',
    conditionStatus: 'good'
  });

  const [assignData, setAssignData] = useState({
    assetId: '',
    userId: ''
  });

  const assetTypes = ['laptop', 'imac', 'mouse', 'keyboard', 'headphone', 'charger', 'bag'];
  const conditionStatuses = ['good', 'bad', 'repair', 'broken'];

  useEffect(() => {
    fetchAssets();
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [assets, searchTerm, filterType, filterStatus]);

  const fetchAssets = async () => {
    try {
      const response = await api.get('/assets');
      setAssets(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assets:', error);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filterAssets = () => {
    let filtered = assets;

    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(asset => asset.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(asset => asset.assignmentStatus === filterStatus);
    }

    setFilteredAssets(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      brand: '',
      model: '',
      serialNumber: '',
      specification: '',
      processor: '',
      ram: '',
      rom: '',
      conditionStatus: 'good'
    });
    setAssignData({ assetId: '', userId: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (type, asset = null) => {
    setModalType(type);
    setSelectedAsset(asset);
    setShowModal(true);
    
    if (type === 'edit' && asset) {
      setFormData({
        name: asset.name || '',
        type: asset.type || '',
        brand: asset.brand || '',
        model: asset.model || '',
        serialNumber: asset.serialNumber || '',
        specification: asset.specification || '',
        processor: asset.processor || '',
        ram: asset.ram || '',
        rom: asset.rom || '',
        conditionStatus: asset.conditionStatus || 'good'
      });
    } else if (type === 'assign' && asset) {
      setAssignData({ assetId: asset._id, userId: '' });
    } else {
      resetForm();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAsset(null);
    resetForm();
  };

  const handleSubmit = async () => {
    try {
      if (modalType === 'create') {
        // Validation for required fields
        if (!formData.name || !formData.type || !formData.serialNumber) {
          alert('Please fill in all required fields');
          return;
        }
        if (isLaptopOrImac && (!formData.processor || !formData.ram || !formData.rom)) {
          alert('Please fill in processor, RAM, and storage for laptop/iMac');
          return;
        }
        await api.post('/assets', formData);
      } else if (modalType === 'edit') {
        if (!formData.name || !formData.type || !formData.serialNumber) {
          alert('Please fill in all required fields');
          return;
        }
        if (isLaptopOrImac && (!formData.processor || !formData.ram || !formData.rom)) {
          alert('Please fill in processor, RAM, and storage for laptop/iMac');
          return;
        }
        await api.put(`/assets/${selectedAsset._id}`, formData);
      } else if (modalType === 'assign') {
        if (!assignData.userId) {
          alert('Please select a user');
          return;
        }
        await api.post('/assets/assign', assignData);
      }
      
      fetchAssets();
      closeModal();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleDelete = async (assetId) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await api.delete(`/assets/${assetId}`);
        fetchAssets();
      } catch (error) {
        console.error('Error deleting asset:', error);
        alert(error.response?.data?.message || 'An error occurred');
      }
    }
  };

  const handleReturn = async (assetId) => {
    if (window.confirm('Are you sure you want to return this asset?')) {
      try {
        await api.put(`/assets/return/${assetId}`);
        fetchAssets();
      } catch (error) {
        console.error('Error returning asset:', error);
        alert(error.response?.data?.message || 'An error occurred');
      }
    }
  };

  const isLaptopOrImac = formData.type === 'laptop' || formData.type === 'imac';

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Asset Management</h1>
        <button
          onClick={() => openModal('create')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Add Asset
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold text-gray-800">{assets.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned</p>
              <p className="text-2xl font-bold text-green-600">
                {assets.filter(a => a.assignmentStatus === 'assigned').length}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-blue-600">
                {assets.filter(a => a.assignmentStatus === 'unassigned').length}
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Needs Repair</p>
              <p className="text-2xl font-bold text-red-600">
                {assets.filter(a => a.conditionStatus === 'repair' || a.conditionStatus === 'broken').length}
              </p>
            </div>
            <Package className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {assetTypes.map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Available</option>
          </select>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.map((asset) => (
                <tr key={asset._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                      <div className="text-sm text-gray-500">{asset.brand} {asset.model}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {asset.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.serialNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      asset.assignmentStatus === 'assigned' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {asset.assignmentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.assignedTo ? (
                      <div>
                        <div>{asset.assignedTo.name}</div>
                        <div className="text-xs text-gray-500">{asset.assignedTo.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      asset.conditionStatus === 'good' ? 'bg-green-100 text-green-800' :
                      asset.conditionStatus === 'bad' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {asset.conditionStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal('edit', asset)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={16} />
                      </button>
                      {asset.assignmentStatus === 'unassigned' && (
                        <button
                          onClick={() => openModal('assign', asset)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Users size={16} />
                        </button>
                      )}
                      {asset.assignmentStatus === 'assigned' && (
                        <button
                          onClick={() => handleReturn(asset._id)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Return
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(asset._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAssets.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No assets found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {modalType === 'create' ? 'Create Asset' : 
               modalType === 'edit' ? 'Edit Asset' : 'Assign Asset'}
            </h2>
            
            <div className="space-y-4">
              {modalType !== 'assign' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Type</option>
                      {assetTypes.map(type => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number *</label>
                    <input
                      type="text"
                      name="serialNumber"
                      value={formData.serialNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specification</label>
                    <textarea
                      name="specification"
                      value={formData.specification}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {isLaptopOrImac && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Processor *</label>
                        <input
                          type="text"
                          name="processor"
                          value={formData.processor}
                          onChange={handleInputChange}
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">RAM *</label>
                        <input
                          type="text"
                          name="ram"
                          value={formData.ram}
                          onChange={handleInputChange}
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Storage *</label>
                        <input
                          type="text"
                          name="rom"
                          value={formData.rom}
                          onChange={handleInputChange}
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition Status</label>
                    <select
                      name="conditionStatus"
                      value={formData.conditionStatus}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      {conditionStatuses.map(status => (
                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to User *</label>
                  <select
                    value={assignData.userId}
                    onChange={(e) => setAssignData(prev => ({ ...prev, userId: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select User</option>
                    {users.filter(user => user.role !== 'admin').map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email}) - {user.role}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {modalType === 'create' ? 'Create' : 
                   modalType === 'edit' ? 'Update' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssetTab;