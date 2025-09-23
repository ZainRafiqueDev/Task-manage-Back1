import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../services/userApi';

const TeamLeadPage = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [myTeam, setMyTeam] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('manage');

  // Fetch all employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/employees');
      if (response.data.success) {
        setEmployees(response.data.employees);
      }
    } catch (err) {
      setError('Failed to fetch employees');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch my team members
  const fetchMyTeam = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/my-team');
      if (response.data.success) {
        setMyTeam(response.data.teamMembers);
      }
    } catch (err) {
      setError('Failed to fetch team members');
      console.error('Error fetching team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'teamlead') {
      fetchEmployees();
      fetchMyTeam();
    }
  }, [user]);

  // Handle employee selection
  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  // Assign selected employees to team
  const handleAssignToTeam = async () => {
    if (selectedEmployees.length === 0) {
      setError('Please select at least one employee');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await api.post('/users/assign-team', {
        employeeIds: selectedEmployees
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        setSelectedEmployees([]);
        // Refresh data
        await fetchEmployees();
        await fetchMyTeam();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign employees');
      console.error('Error assigning team:', err);
    } finally {
      setLoading(false);
    }
  };

  // Remove employee from team
  const handleRemoveFromTeam = async (employeeId) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await api.post('/users/remove-team', {
        employeeIds: [employeeId]
      });

      if (response.data.success) {
        setSuccess('Employee removed from team');
        // Refresh data
        await fetchEmployees();
        await fetchMyTeam();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove employee');
      console.error('Error removing employee:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (user?.role !== 'teamlead') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need Team Lead privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="mt-2 text-gray-600">Manage your team members and assignments</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="text-red-800">{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="text-green-800">{success}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'manage'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Manage Team
              </button>
              <button
                onClick={() => setActiveTab('myteam')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'myteam'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Team ({myTeam.length})
              </button>
            </nav>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Manage Team Tab */}
        {activeTab === 'manage' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Available Employees</h2>
              <p className="text-sm text-gray-500 mt-1">
                Select employees to add to your team. Selected: {selectedEmployees.length}
              </p>
            </div>

            {selectedEmployees.length > 0 && (
              <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
                <button
                  onClick={handleAssignToTeam}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Assigning...' : `Assign ${selectedEmployees.length} to Team`}
                </button>
              </div>
            )}

            <div className="overflow-hidden">
              {employees.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  No available employees found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {employees.map((employee) => {
                    const isInMyTeam = myTeam.some(member => member._id === employee._id);
                    const isSelected = selectedEmployees.includes(employee._id);
                    
                    return (
                      <div
                        key={employee._id}
                        className={`px-6 py-4 hover:bg-gray-50 ${
                          isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleEmployeeSelect(employee._id)}
                              disabled={isInMyTeam}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                            />
                            <div className="ml-4">
                              <div className="flex items-center">
                                <h3 className="text-sm font-medium text-gray-900">
                                  {employee.name}
                                </h3>
                                {isInMyTeam && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    In Your Team
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{employee.email}</p>
                              <p className="text-xs text-gray-400">
                                CNIC: {employee.cnic} | Phone: {employee.phone}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              employee.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {employee.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Team Tab */}
        {activeTab === 'myteam' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">My Team Members</h2>
              <p className="text-sm text-gray-500 mt-1">
                {myTeam.length} team member{myTeam.length !== 1 ? 's' : ''} assigned to you
              </p>
            </div>

            <div className="overflow-hidden">
              {myTeam.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 9a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  No team members assigned yet
                  <p className="text-sm text-gray-400 mt-1">
                    Go to "Manage Team" tab to assign employees to your team
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {myTeam.map((member) => (
                    <div key={member._id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{member.name}</h3>
                          <p className="text-sm text-gray-500">{member.email}</p>
                          <p className="text-xs text-gray-400">
                            CNIC: {member.cnic} | Phone: {member.phone}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => handleRemoveFromTeam(member._id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamLeadPage;