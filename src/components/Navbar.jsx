import "../styles/Navbar.css";

function Navbar({ user, onLogout, activeTab, onTabChange }) {
  const firstName = user?.firstName || "Customer";
  const lastName = user?.lastName || "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="logo" onClick={() => onTabChange("overview")}>
          <span className="logo-icon">A</span>
          <div className="logo-text">
            <strong>ApexTrust Bank</strong>
            <small>Personal Banking</small>
          </div>
        </div>

        <nav className="nav-links">
          <button
            type="button"
            className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => onTabChange("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === "cards" ? "active" : ""}`}
            onClick={() => onTabChange("cards")}
          >
            Accounts and Card
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === "transfer" ? "active" : ""}`}
            onClick={() => onTabChange("transfer")}
          >
            Transfer and Pay
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === "statements" ? "active" : ""}`}
            onClick={() => onTabChange("statements")}
          >
            Statements
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => onTabChange("profile")}
          >
            Profile and KYC
          </button>
        </nav>

        <div className="nav-right">
          <div className="user-chip" onClick={() => onTabChange("profile")} style={{ cursor: "pointer" }}>
            <span className="avatar">{initials || "A"}</span>
            <div className="user-info">
              <strong>{firstName} {lastName}</strong>
              <span className="kyc-badge">KYC Verified</span>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
