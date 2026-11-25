import { useState } from "react";
import { api } from "../services/api";
import "../styles/Auth.css";

function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.login(email, password);
        onLoginSuccess(data.customer);
      } else {
        if (!firstName.trim() || !lastName.trim()) {
          setError("Please enter your full legal name.");
          setLoading(false);
          return;
        }

        const profileData = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          dateOfBirth,
          address: address.trim(),
          panNumber: panNumber.trim().toUpperCase(),
        };

        const data = await api.register(profileData);
        onLoginSuccess(data.customer);
      }
    } catch (err) {
      setError(err.message || "Failed to authenticate. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">A</div>
          <h1>ApexTrust Digital Bank</h1>
          <p>{isLogin ? "Secure Online Banking Access" : "Open Your Verified Digital Savings Account"}</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${isLogin ? "active" : ""}`}
            onClick={() => { setIsLogin(true); setError(""); }}
          >
            Existing Customer (Sign In)
          </button>
          <button
            type="button"
            className={`auth-tab ${!isLogin ? "active" : ""}`}
            onClick={() => { setIsLogin(false); setError(""); }}
          >
            New Customer (KYC Registration)
          </button>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isLogin ? (
            <>
              <div className="field-group">
                <label>Registered Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="field-group">
                <label>Internet Banking Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <span className="auth-section-title">Personal Information</span>
              <div className="form-row">
                <div className="field-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    placeholder="Rahul"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="field-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    placeholder="Modi"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="field-group">
                  <label>Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="field-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                  />
                </div>
              </div>

              <span className="auth-section-title">KYC & Identity Verification</span>
              <div className="field-group">
                <label>PAN / National ID Number</label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="field-group">
                <label>Residential Address</label>
                <input
                  type="text"
                  placeholder="House / Street, City, State, PIN"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <span className="auth-section-title">Account Security</span>
              <div className="field-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="rahul@modi.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field-group">
                <label>Create Strong Password</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Authenticating with Bank..." : isLogin ? "Secure Sign In" : "Complete KYC & Open Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Auth;
