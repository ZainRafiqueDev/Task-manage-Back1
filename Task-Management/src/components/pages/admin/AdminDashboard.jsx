import React, { useState } from "react";
import AuthProvider, { useAuth } from "../../../context/AuthContext";
import ProjectTabs from "./tabs/ProjectTabs";
import TasksTab from "./tabs/TasksTab";
import UsersTab from "./tabs/UsersTab";
import MilestonesTab from "./tabs/MilestoneTab";
import AddonsTab from "./tabs/AddonsTab";
import PaymentsTab from "./tabs/PaymentsTab";
import ReportsTab from "./tabs/REportsTab";
import NotificationsTab from "./tabs/NotifcationTabs";
import AssetTab from "./tabs/AssetTab";


const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("projects");

  const tabs = {
    projects: <ProjectTabs />,
    // tasks: <TasksTab />,
    users: <UsersTab />,
    // milestones: <MilestonesTab />,
    // addons: <AddonsTab />,
    // payments: <PaymentsTab />,
    reports: <ReportsTab />,
    notifications: <NotificationsTab />,
    assets: <AssetTab />
  };

  return (
   
    <div className="p-6">
        
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      <p className="mb-4">Welcome, {user?.email}</p>

      {/* Tab Menu */}
      <div className="flex gap-4 mb-6">
        {Object.keys(tabs).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200"
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

export default AdminDashboard;
