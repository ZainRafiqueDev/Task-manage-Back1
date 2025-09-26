// context/AuthContext.jsx
import { createContext, useState, useEffect, useContext, useRef } from "react";
import api from "../services/api"; // Axios instance

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // prevent double API calls in React StrictMode
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    const checkSession = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get("/auth/me", { withCredentials: true });

        if (response.data?.user) {
          setUser(response.data.user);
          console.log("✅ User session restored:", response.data.user);
        }
      } catch (err) {
        console.error("❌ Session restore failed:", err);
        setError(err.response?.data?.message || "Failed to restore session");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Login
  const login = (userData) => {
    setUser(userData);
    setError(null);
    console.log("✅ User logged in:", userData);
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      await api.post("/auth/logout", {}, { withCredentials: true });
      console.log("✅ Logout successful");
    } catch (err) {
      console.error("❌ Logout failed:", err);
    } finally {
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  const hasRole = (role) => user && user.role === role;
  const hasAnyRole = (roles) => user && roles.includes(user.role);
  const isAuthenticated = () => !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        hasRole,
        hasAnyRole,
        isAuthenticated,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export default AuthProvider;
