import React from "react";
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-blue-600 text-white py-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center px-4">
        <h1 className="text-xl font-bold">Company Portal</h1>

        <nav className="flex gap-4 items-center">
          {!user ? (
            <>
              <a href="/login" className="hover:underline">Login</a>
              <a href="/register" className="hover:underline">Register</a>
            </>
          ) : (
            <>
              {/* Role-based dashboard links */}
              {user.role === "admin" && (
                <a href="/admin/dashboard" className="hover:underline">Admin</a>
              )}
              {user.role === "teamlead" && (
                <a href="/teamlead/dashboard" className="hover:underline">TeamLead</a>
              )}
              {user.role === "employee" && (
                <a href="/employee/dashboard" className="hover:underline">Employee</a>
              )}

              <span>{user.email}</span>
              <button
                onClick={logout}
                className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
