import React, { useState } from "react";
import { FolderOpen, CheckSquare, TrendingUp, Bell, FileText, Briefcase, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import ProjectsTab from "./tabs/ProjectsTab";
import TasksTab from "./tabs/TasksTab";
import PerformanceTab from "./tabs/PerformanceTab";
import NotificationsTab from "./tabs/NotifcationTab";
import ReportTab from "./tabs/ReportTab";
import AssetsTab from "./tabs/AssetTab";

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("projects");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tabs = {
    projects: <ProjectsTab />,
    tasks: <TasksTab />,
    performance: <PerformanceTab />,
    notifications: <NotificationsTab />,
    reports: <ReportTab />,
    assets: <AssetsTab />
  };

  const menuItems = [
    { key: "projects", label: "Projects", icon: FolderOpen },
    { key: "tasks", label: "Tasks", icon: CheckSquare },
    { key: "performance", label: "Performance", icon: TrendingUp },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "reports", label: "Reports", icon: FileText },
    { key: "assets", label: "Assets", icon: Briefcase },
    { key: "logout", label: "Logout", icon: LogOut, action: logout, isAction: true }
  ];

  return (
    <div className="flex h-screen bg-blue-50">
      {/* Sidebar */}
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-xl transition-all duration-300 relative flex flex-col border-r border-blue-200`}>
        {/* Logo Section */}
        <div 
          className="p-4 border-b border-blue-200 flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <img 
            src="/logo.jpg" 
            alt="Company Logo" 
            className={`${isCollapsed ? 'w-8 h-8' : 'w-12 h-12'} object-contain transition-all duration-300 rounded-full bg-blue-50 p-1 border border-blue-200`}
          />
        </div>
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-blue-200 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex-1">
              <h2 className="text-xl font-bold text-blue-900">Employee Dashboard</h2>
              <p className="text-sm text-blue-600 mt-1 truncate">Welcome, {user?.email}</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md hover:bg-blue-100 transition-colors text-blue-700"
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>
        
        <nav className="mt-4 flex-1 px-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => item.isAction ? item.action() : setActiveTab(item.key)}
                className={`w-full flex items-center px-4 py-3 mb-1 rounded-lg text-left transition-all duration-200 ${
                  activeTab === item.key && !item.isAction
                    ? "bg-blue-600 text-white shadow-md"
                    : item.isAction
                    ? "text-red-500 hover:bg-red-50 hover:text-red-600"
                    : "text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <IconComponent size={20} className={`${isCollapsed ? '' : 'mr-3'} ${item.isAction ? 'text-red-500' : ''}`} />
                {!isCollapsed && (
                  <span className={`font-medium ${item.isAction ? 'text-red-500' : ''}`}>
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

export default EmployeeDashboard;