import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import { api } from "./services/api";

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function verifyUser() {
      const token = api.getToken();
      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        const data = await api.getMe();
        if (data.authenticated && data.customer) {
          setUser(data.customer);
        } else {
          localStorage.removeItem("bms_token");
        }
      } catch (err) {
        console.error("Session verification failed", err);
        localStorage.removeItem("bms_token");
      } finally {
        setCheckingAuth(false);
      }
    }

    verifyUser();
  }, []);

  async function handleLogout() {
    await api.logout();
    setUser(null);
  }

  if (checkingAuth) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        color: "#64748b",
        fontWeight: 600,
      }}>
        Connecting to ApexTrust...
      </div>
    );
  }

  if (!user) {
    return <Auth onLoginSuccess={(customer) => setUser(customer)} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App;
