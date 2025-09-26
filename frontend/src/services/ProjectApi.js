// utils/ProjectApi.js
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// Helper function to get auth headers from both localStorage and cookies
const getAuthHeaders = () => {
  let token = null;

  // First try to get token from localStorage
  const user = localStorage.getItem("user");
  if (user) {
    try {
      const userData = JSON.parse(user);
      token = userData.token;
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
    }
  }

  // If no token from localStorage, try to get from cookies
  if (!token) {
    token = getCookie("token");
  }

  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function to get cookie value by name
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookie-based auth
});

// Add auth headers to all requests
api.interceptors.request.use(
  (config) => {
    const authHeaders = getAuthHeaders();
    config.headers = { ...config.headers, ...authHeaders };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      // Clear auth cookie
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

/* ================= BASIC PROJECT OPERATIONS ================= */

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @returns {Promise} API response
 */
export const createProject = async (projectData) => {
  return await api.post("/admin/projects", projectData);
};

/**
 * Get all projects
 * @returns {Promise} API response
 */
export const getAllProjects = async () => {
  return await api.get("/admin/projects");
};

/**
 * Get project by ID
 * @param {string} id - Project ID
 * @returns {Promise} API response
 */
export const getProjectById = async (id) => {
  return await api.get(`/admin/projects/${id}`);
};

/**
 * Update project
 * @param {string} id - Project ID
 * @param {Object} data - Update data
 * @returns {Promise} API response
 */
export const updateProject = async (id, data) => {
  return await api.put(`/admin/projects/${id}`, data);
};

/**
 * Delete project
 * @param {string} id - Project ID
 * @returns {Promise} API response
 */
export const deleteProject = async (id) => {
  return await api.delete(`/admin/projects/${id}`);
};

/* ================= PROJECT DETAILS ================= */

/**
 * Add project details
 * @param {string} projectId - Project ID
 * @param {Object} data - Details data
 * @returns {Promise} API response
 */
export const addProjectDetails = async (projectId, data) => {
  return await api.post(`/admin/projects/${projectId}/details`, data);
};

/**
 * Get project details
 * @param {string} projectId - Project ID
 * @returns {Promise} API response
 */
export const getProjectDetails = async (projectId) => {
  return await api.get(`/admin/projects/${projectId}/details`);
};

/**
 * Update project details
 * @param {string} projectId - Project ID
 * @param {string} detailId - Detail ID
 * @param {Object} data - Update data
 * @returns {Promise} API response
 */
export const updateProjectDetails = async (projectId, detailId, data) => {
  return await api.put(`/admin/projects/${projectId}/details/${detailId}`, data);
};

/**
 * Delete project details
 * @param {string} projectId - Project ID
 * @param {string} detailId - Detail ID
 * @returns {Promise} API response
 */
export const deleteProjectDetails = async (projectId, detailId) => {
  return await api.delete(`/admin/projects/${projectId}/details/${detailId}`);
};

/* ================= PAYMENTS ================= */

/**
 * Add payment to project
 * @param {string} projectId - Project ID
 * @param {Object} data - Payment data
 * @returns {Promise} API response
 */
export const addPayment = async (projectId, data) => {
  return await api.post(`/admin/projects/${projectId}/payments`, data);
};

/**
 * Update payment
 * @param {string} projectId - Project ID
 * @param {string} paymentId - Payment ID
 * @param {Object} data - Update data
 * @returns {Promise} API response
 */
export const updatePayment = async (projectId, paymentId, data) => {
  return await api.put(`/admin/projects/${projectId}/payments/${paymentId}`, data);
};

/**
 * Delete payment
 * @param {string} projectId - Project ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise} API response
 */
export const deletePayment = async (projectId, paymentId) => {
  return await api.delete(`/admin/projects/${projectId}/payments/${paymentId}`);
};

/* ================= TIME ENTRIES ================= */

/**
 * Add time entry to project
 * @param {string} projectId - Project ID
 * @param {Object} data - Time entry data
 * @returns {Promise} API response
 */
export const addTimeEntry = async (projectId, data) => {
  return await api.post(`/admin/projects/${projectId}/time-entries`, data);
};

/**
 * Update time entry
 * @param {string} projectId - Project ID
 * @param {string} entryId - Time entry ID
 * @param {Object} data - Update data
 * @returns {Promise} API response
 */
export const updateTimeEntry = async (projectId, entryId, data) => {
  return await api.put(`/admin/projects/${projectId}/time-entries/${entryId}`, data);
};

/**
 * Delete time entry
 * @param {string} projectId - Project ID
 * @param {string} entryId - Time entry ID
 * @returns {Promise} API response
 */
export const deleteTimeEntry = async (projectId, entryId) => {
  return await api.delete(`/admin/projects/${projectId}/time-entries/${entryId}`);
};

/* ================= MILESTONES ================= */

/**
 * Add milestone to project
 * @param {string} projectId - Project ID
 * @param {Object} data - Milestone data
 * @returns {Promise} API response
 */
export const addMilestone = async (projectId, data) => {
  return await api.post(`/admin/projects/${projectId}/milestones`, data);
};

/**
 * Update milestone
 * @param {string} projectId - Project ID
 * @param {string} milestoneId - Milestone ID
 * @param {Object} data - Update data
 * @returns {Promise} API response
 */
export const updateMilestone = async (projectId, milestoneId, data) => {
  return await api.put(`/admin/projects/${projectId}/milestones/${milestoneId}`, data);
};

/**
 * Delete milestone
 * @param {string} projectId - Project ID
 * @param {string} milestoneId - Milestone ID
 * @returns {Promise} API response
 */
export const deleteMilestone = async (projectId, milestoneId) => {
  return await api.delete(`/admin/projects/${projectId}/milestones/${milestoneId}`);
};

/* ================= CLIENT STATUS ================= */

/**
 * Update client status
 * @param {string} projectId - Project ID
 * @param {string} clientStatus - Status value
 * @returns {Promise} API response
 */
export const updateClientStatus = async (projectId, clientStatus) => {
  return await api.put(`/admin/projects/${projectId}/client-status`, { clientStatus });
};

/* ================= TEAM MANAGEMENT ================= */

/**
 * Assign team lead to project
 * @param {string} projectId - Project ID
 * @param {string} teamLead - Team lead user ID
 * @returns {Promise} API response
 */
export const assignTeamLead = async (projectId, teamLead) => {
  return await api.put(`/admin/projects/${projectId}/teamlead`, { teamLead });
};

/**
 * Assign employees to project
 * @param {string} projectId - Project ID
 * @param {Array} employees - Array of employee user IDs
 * @returns {Promise} API response
 */
export const assignEmployees = async (projectId, employees) => {
  return await api.put(`/admin/projects/${projectId}/employees`, { employees });
};

/* ================= PROJECT GROUPS ================= */

/**
 * Create project group
 * @param {Object} data - Group data
 * @returns {Promise} API response
 */
export const addProjectGroup = async (data) => {
  return await api.post("/admin/project-groups", data);
};

/**
 * Get all project groups
 * @returns {Promise} API response
 */
export const getAllProjectGroups = async () => {
  return await api.get("/admin/project-groups");
};

/**
 * Update project group
 * @param {string} id - Group ID
 * @param {Object} data - Update data
 * @returns {Promise} API response
 */
export const updateProjectGroup = async (id, data) => {
  return await api.put(`/admin/project-groups/${id}`, data);
};

/**
 * Delete project group
 * @param {string} id - Group ID
 * @returns {Promise} API response
 */
export const deleteProjectGroup = async (id) => {
  return await api.delete(`/admin/project-groups/${id}`);
};

/* ================= UTILITY FUNCTIONS ================= */

/**
 * Recalculate project totals
 * @param {string} projectId - Project ID
 * @returns {Promise} API response
 */
export const recalculateProject = async (projectId) => {
  return await api.put(`/admin/projects/${projectId}/recalculate`);
};

/* ================= ROLE-SPECIFIC PROJECT FUNCTIONS ================= */

/**
 * Get projects for employees
 * @returns {Promise} API response
 */
export const getEmployeeProjects = async () => {
  return await api.get("/employee/projects");
};

/**
 * Get projects for team leads
 * @returns {Promise} API response
 */
export const getTeamLeadProjects = async () => {
  return await api.get("/teamlead/projects/mine");
};

/**
 * Get my projects (role-based)
 * @returns {Promise} API response
 */
export const getMyProjects = async () => {
  return await api.get("/projects/my-projects");
};

/**
 * Pick a project (for team leads)
 * @param {string} projectId - Project ID
 * @returns {Promise} API response
 */
export const pickProject = async (projectId) => {
  return await api.put(`/projects/${projectId}/pick`);
};

/**
 * Get assigned projects (for employees)
 * @returns {Promise} API response
 */
export const getAssignedProjects = async () => {
  return await api.get("/projects/assigned");
};

/* ================= LEGACY/ALTERNATIVE FUNCTIONS (for backward compatibility) ================= */

/**
 * Alternative function names that might be used in legacy code
 */
export const createProjectGroup = addProjectGroup;
export const getProjectGroups = getAllProjectGroups;

/* ================= BULK OPERATIONS ================= */

/**
 * Fix all project calculations (admin utility)
 * @returns {Promise} API response
 */
export const fixAllProjectCalculations = async () => {
  return await api.put("/admin/projects/fix-all-calculations");
};

/* ================= EXPORT DEFAULT API INSTANCE ================= */
export default api;

/* ================= HELPER FUNCTIONS FOR TOKEN MANAGEMENT ================= */

/**
 * Set authentication token in cookie
 * @param {string} token - JWT token
 * @param {number} days - Days until expiration (default: 7)
 */
export const setAuthToken = (token, days = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `token=${token}; ${expires}; path=/; secure; samesite=strict`;
};

/**
 * Remove authentication token from cookie and localStorage
 */
export const removeAuthToken = () => {
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  localStorage.removeItem("user");
};

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  const headers = getAuthHeaders();
  return !!headers.Authorization;
};

/**
 * Get current user info from localStorage
 * @returns {Object|null} User data
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  if (user) {
    try {
      return JSON.parse(user);
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }
  
  return null;
};
// };
// export const  addPaymentrecalculation(req, res, next){
//     const requirte -= aleminr .user .info 

// }