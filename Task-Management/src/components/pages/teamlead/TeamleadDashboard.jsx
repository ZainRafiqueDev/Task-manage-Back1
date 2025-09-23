import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import ProjectsTab from "./tabs/ProjectsTab";
import EmployeesTab from "./tabs/EmployeesTab";
import TasksTab from "./tabs/TasksTab";
import ReportsTab from "./tabs/Reports";
import NotificationsTab from "./tabs/NotifcationTab";

const TeamLeadDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("projects");

  const tabs = {
    projects: <ProjectsTab />,
    employees: <EmployeesTab />,
    tasks: <TasksTab />,
    reports: <ReportsTab />,
    notifications: <NotificationsTab />,
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">TeamLead Dashboard</h2>
      <p className="mb-4">Welcome, {user?.email}</p>

      {/* Tab Menu */}
      <div className="flex gap-4 mb-6">
        {Object.keys(tabs).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab ? "bg-green-600 text-white" : "bg-gray-200"
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="border rounded p-4">{tabs[activeTab]}</div>

      <button
        onClick={logout}
        className="mt-6 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
};

export default TeamLeadDashboard;
