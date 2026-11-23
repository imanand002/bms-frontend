import { useState } from "react";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("apextrust_current_user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (user) => {
    localStorage.setItem("apextrust_current_user", JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("apextrust_current_user");
    setCurrentUser(null);
  };

  return currentUser ? (
    <Dashboard user={currentUser} onLogout={handleLogout} />
  ) : (
    <AuthPage onLoginSuccess={handleLoginSuccess} />
  );
}

export default App;