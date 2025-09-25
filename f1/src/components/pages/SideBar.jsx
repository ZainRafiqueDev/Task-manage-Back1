import React, { useState } from 'react';
import { 
  Menu, X, Home, Users, FolderOpen, ClipboardList, 
  Package, BarChart3, Bell, Settings, User, LogOut,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const Sidebar = ({ userRole, activeTab, setActiveTab, onLogout, userName, userEmail }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigationItems = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'projects', label: 'Projects', icon: FolderOpen },
      { id: 'users', label: 'User Management', icon: Users },
      { id: 'tasks', label: 'Task Management', icon: ClipboardList },
      { id: 'assets', label: 'Assets', icon: Package },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ],
    teamlead: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'projects', label: 'My Projects', icon: FolderOpen },
      { id: 'employees', label: 'Team Members', icon: Users },
      { id: 'tasks', label: 'Task Assignment', icon: ClipboardList },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ],
    employee: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'projects', label: 'My Projects', icon: FolderOpen },
      { id: 'tasks', label: 'My Tasks', icon: ClipboardList },
      { id: 'performance', label: 'Performance', icon: BarChart3 },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ],
  };

  const handleItemClick = (itemId) => {
    setActiveTab(itemId);
    setIsMobileOpen(false);
  };

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className={`p-4 border-b border-gray-200 ${isCollapsed ? 'px-2' : ''}`}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <div className="h-4 w-4 bg-white rounded-sm"></div>
              </div>
              <span className="font-bold text-gray-900">TaskFlow</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-gray-100 lg:block hidden"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      {/* User Profile Section */}
      <div className={`p-4 border-b border-gray-200 ${isCollapsed ? 'px-2' : ''}`}>
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                {userRole}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navigationItems[userRole]?.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    w-full flex items-center px-3 py-2.5 rounded-lg transition-colors duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${isCollapsed ? 'justify-center' : 'justify-start'}
                  `}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Settings & Logout */}
      <div className="border-t border-gray-200 p-2">
        <button
          className={`
            w-full flex items-center px-3 py-2.5 rounded-lg transition-colors duration-200
            text-gray-600 hover:bg-gray-50 hover:text-gray-900
            ${isCollapsed ? 'justify-center' : 'justify-start'}
          `}
          title={isCollapsed ? 'Settings' : ''}
        >
          <Settings className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
          {!isCollapsed && <span className="font-medium">Settings</span>}
        </button>
        
        <button
          onClick={onLogout}
          className={`
            w-full flex items-center px-3 py-2.5 rounded-lg transition-colors duration-200
            text-red-600 hover:bg-red-50 hover:text-red-700 mt-1
            ${isCollapsed ? 'justify-center' : 'justify-start'}
          `}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileOpen(false)} />
          <div className="relative w-64 max-w-xs h-full bg-white shadow-xl flex flex-col">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;