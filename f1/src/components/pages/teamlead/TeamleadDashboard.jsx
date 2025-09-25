import React, { useState } from "react";
import { FolderOpen, Users, FileBarChart, Briefcase, Bell, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import ProjectsTab from "./tabs/ProjectsTab";
import EmployeesTab from "./tabs/EmployeesTab";
// import TasksTab from "./tabs/TasksTab";
import ReportsTab from "./tabs/Reports";
import NotificationsTab from "./tabs/NotifcationTab";
import TeamLeadAssetsTab from "./tabs/AssetTab";

const TeamLeadDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("projects");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tabs = {
    projects: <ProjectsTab />,
    employees: <EmployeesTab />,
    // tasks: <TasksTab />,
    reports: <ReportsTab />,
    asset: <TeamLeadAssetsTab />,
    notifications: <NotificationsTab />,
  };

  const menuItems = [
    { key: "projects", label: "Projects", icon: FolderOpen },
    { key: "employees", label: "Employees", icon: Users },
    { key: "reports", label: "Reports", icon: FileBarChart },
    { key: "asset", label: "Assets", icon: Briefcase },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "logout", label: "Logout", icon: LogOut, action: logout, isAction: true }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg transition-all duration-300 relative flex flex-col`}>
         <div className="p-4 border-b flex items-center justify-center">
          <img 
            src="/logo.jpg" 
            alt="Company Logo" 
            className={`${isCollapsed ? 'w-8 h-8' : 'w-12 h-12'} object-contain transition-all duration-300`}
          />
        </div>
        {/* Sidebar Header */}
        <div className="p-6 border-b flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800">TeamLead Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1 truncate">Welcome, {user?.email}</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>
        
        <nav className="mt-6 flex-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => item.isAction ? item.action() : setActiveTab(item.key)}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                  activeTab === item.key && !item.isAction
                    ? "bg-green-50 text-green-600 border-r-2 border-green-600"
                    : item.isAction
                    ? "text-red-600 hover:bg-red-50"
                    : "text-gray-700 hover:bg-gray-50"
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <IconComponent size={20} className={isCollapsed ? '' : 'mr-3'} />
                {!isCollapsed && (
                  <span className={`font-medium ${item.isAction ? 'text-red-600' : ''}`}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {tabs[activeTab]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamLeadDashboard;