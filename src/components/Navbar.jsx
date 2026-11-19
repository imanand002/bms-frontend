import "../styles/Navbar.css";

function Navbar() {
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
            <span className="avatar">JD</span>
            <div className="user-info">
              <strong>John Doe</strong>
              <small>Premium Member</small>
            </div>
          </div>
          <button className="logout-btn">Logout</button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;