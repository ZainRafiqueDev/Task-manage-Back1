// context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from "react";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          method: "GET",
          credentials: "include", // include cookies
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user); // should include role, id, etc.
        } else {
          console.error("❌ Auth check failed:", res.status);
        }
      } catch (err) {
        console.error("❌ Session restore failed:", err);
      }
    };

    checkSession();
  }, []);

  const login = (userData) => setUser(userData);

  const logout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("❌ Logout failed:", err);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
