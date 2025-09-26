import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Navbar from "./components/Navbar.jsx"; 
import Login from "./components/pages/Login.jsx";
import Register from "./components/pages/Register.jsx";
import AdminDashboard from "./components/pages/admin/AdminDashboard.jsx";
import TeamLeadDashboard from "./components/pages/teamlead/TeamleadDashboard.jsx";
import EmployeeDashboard from "./components/pages/employee/EmployeeDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AuthProvider from "./context/AuthContext.jsx";
import Header from "./components/Header"; 
import Footer from "./components/Layout/Footer.jsx"; 

function App() {
    return (
        <AuthProvider>
            <Router>
                <Header /> {/* Render the Header Component */}
                {/* <Navbar /> Optional, if you have Navbar for extra links */}
                <Routes>

                    <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route
                        path="/admin"
                        element={
                              <ProtectedRoute allowedRoles={['admin']}>
                                <AuthProvider>
                                <AdminDashboard />
                                </AuthProvider>
                            </ProtectedRoute>

                        }
                    />
                    <Route
                        path="/teamlead"
                        element={
                              <ProtectedRoute allowedRoles={['teamlead']}>
                                <TeamLeadDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/employee"
                        element={
                             <ProtectedRoute allowedRoles={['employee']}>
                                <EmployeeDashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
                <Footer /> {/* Render the Footer Component */}
            </Router>
        </AuthProvider>
    );
}

export default App;
