import "../styles/Navbar.css";

function Navbar({ user, onLogout }) {
  const fullName = user?.name || "User";
  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="logo">
          <span className="logo-icon">A</span>
          <div className="logo-text">
            <strong>ApexTrust</strong>
            <small>Digital Banking</small>
          </div>
        </div>

        <div className="nav-right">
          <div className="user-chip">
            <span className="avatar">{initials}</span>
            <div className="user-info">
              <strong>{fullName}</strong>
              <small>Premium Member</small>
            </div>
          </div>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;