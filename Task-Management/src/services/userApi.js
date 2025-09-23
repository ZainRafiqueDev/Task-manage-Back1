// services/userService.js
import api from './api';

export const userService = {
  // Get all employees (for teamlead to view)
  getEmployees: async () => {
    try {
      const response = await api.get('/users/employees');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get teamlead's assigned team members
  getMyTeam: async () => {
    try {
      const response = await api.get('/users/my-team');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Assign employees to team
  assignTeam: async (employeeIds) => {
    try {
      const response = await api.post('/users/assign-team', { employeeIds });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Remove employees from team
  removeFromTeam: async (employeeIds) => {
    try {
      const response = await api.post('/users/remove-team', { employeeIds });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all users filtered (admin sees all, teamlead sees employees)
  getAllUsersFiltered: async () => {
    try {
      const response = await api.get('/users/filtered');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
export default userService;