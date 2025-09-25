// services/userApi.js
import api from './api'; // Axios instance with process.env config

const userService = {
  // ------------------------
  // User Management
  // ------------------------
  getAllUsers: async () => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching all users:', error.response?.data || error.message);
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error.response?.data || error.message);
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error.response?.data || error.message);
      throw error;
    }
  },

  promoteUser: async (userId) => {
    try {
      const response = await api.patch(`/users/${userId}/promote`);
      return response.data;
    } catch (error) {
      console.error('Error promoting user:', error.response?.data || error.message);
      throw error;
    }
  },

  // ------------------------
  // Team Management
  // ------------------------
  assignTeam: async (employeeIds) => {
    try {
      const response = await api.post('/users/assign-team', { employeeIds });
      return response.data;
    } catch (error) {
      console.error('Error assigning team:', error.response?.data || error.message);
      throw error;
    }
  },

  removeFromTeam: async (employeeIds) => {
    try {
      const response = await api.post('/users/remove-team', { employeeIds });
      return response.data;
    } catch (error) {
      console.error('Error removing from team:', error.response?.data || error.message);
      throw error;
    }
  },

  // ------------------------
  // Employee Management
  // ------------------------
  getEmployees: async () => {
    try {
      const response = await api.get('/users/employees');
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error.response?.data || error.message);
      throw error;
    }
  },

  getAvailableEmployees: async () => {
    try {
      const response = await api.get('/users/employees/available');
      return response.data;
    } catch (error) {
      console.error('Error fetching available employees:', error.response?.data || error.message);
      throw error;
    }
  },

  getMyTeam: async () => {
    try {
      const response = await api.get('/users/team/my-team');
      return response.data;
    } catch (error) {
      console.error('Error fetching my team:', error.response?.data || error.message);
      throw error;
    }
  },

  getAllUsersFiltered: async () => {
    try {
      const response = await api.get('/users/filtered');
      return response.data;
    } catch (error) {
      console.error('Error fetching filtered users:', error.response?.data || error.message);
      throw error;
    }
  },

  // ------------------------
  // Task Management
  // ------------------------
  assignTask: async (taskData) => {
    try {
      const response = await api.post('/users/tasks/assign', taskData);
      return response.data;
    } catch (error) {
      console.error('Error assigning task:', error.response?.data || error.message);
      throw error;
    }
  },

  getMyAssignedTasks: async () => {
    try {
      const response = await api.get('/users/tasks/my-assigned');
      return response.data;
    } catch (error) {
      console.error('Error fetching assigned tasks:', error.response?.data || error.message);
      throw error;
    }
  },

  updateTaskStatus: async (taskId, status) => {
    try {
      const response = await api.patch(`/users/tasks/${taskId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating task status:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    try {
      const response = await api.delete(`/users/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting task:', error.response?.data || error.message);
      throw error;
    }
  },

  getEmployeeTasks: async (employeeId) => {
    try {
      const response = await api.get(`/users/employees/${employeeId}/tasks`);
      return response.data;
    } catch (error) {
      console.error('Error fetching employee tasks:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default userService;
