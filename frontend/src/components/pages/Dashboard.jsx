// src/pages/Dashboard.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext"; // assuming you have auth context
import AdminDashboard from "../components/admin/AdminDashboard";
import TeamLeadDashboard from "../components/teamlead/TeamLeadDashboard";
import EmployeeDashboard from "../components/employee/EmployeeDashboard";

const Dashboard = () => {
  const { user } = useAuth(); // user contains role: "admin" | "teamlead" | "employee"

  if (!user) return <p className="text-center text-lg">Loading...</p>;

  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "teamlead":
      return <TeamLeadDashboard />;
    case "employee":
      return <EmployeeDashboard />;
    default:
      return <p className="text-red-500">Unauthorized role</p>;
  }
};

export default Dashboard;
