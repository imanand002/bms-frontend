import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import { api } from "../services/api";
import { formatAccountNumber, maskAccountNumber, parseAccountNumber, downloadMiniStatementCSV } from "../utils/formatters";
import "../styles/Dashboard.css";

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [currentUser, setCurrentUser] = useState(user);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal forms
  const [activeForm, setActiveForm] = useState(null); // DEPOSIT, WITHDRAWAL, TRANSFER, OPEN_ACCOUNT
  const [amount, setAmount] = useState("");
  const [fromAcc, setFromAcc] = useState("");
  const [toAcc, setToAcc] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [transferReceipt, setTransferReceipt] = useState(null);

  // Beneficiary Lookup
  const [beneficiaryInfo, setBeneficiaryInfo] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");

  // Virtual Card States
  const [showCvv, setShowCvv] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Statements Search & Filter
  const [txFilter, setTxFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Profile Edit
  const [editingProfile, setEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [editAddress, setEditAddress] = useState(user?.address || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [accs, txs, meData] = await Promise.all([
        api.getAccounts(),
        api.getTransactions(),
        api.getMe().catch(() => null),
      ]);
      setAccounts(accs);
      setTransactions(txs);
      if (meData?.customer) {
        setCurrentUser(meData.customer);
        setEditPhone(meData.customer.phone || "");
        setEditAddress(meData.customer.address || "");
      }

      if (accs.length > 0 && !fromAcc) {
        setFromAcc(String(accs[0].number));
      }
    } catch (err) {
      console.error("Failed to load banking data", err);
    } finally {
      setLoading(false);
    }
  }, [fromAcc]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function verifyBeneficiary(rawInput) {
    if (!rawInput || String(rawInput).trim().length < 3) {
      setBeneficiaryInfo(null);
      setLookupError("");
      return;
    }

    const resolvedAcc = parseAccountNumber(rawInput);
    setLookingUp(true);
    setLookupError("");
    setBeneficiaryInfo(null);

    try {
      const res = await api.lookupAccount(resolvedAcc);
      if (res.exists) {
        setBeneficiaryInfo(res);
      }
    } catch (err) {
      setLookupError(err.message || "Beneficiary account not found");
    } finally {
      setLookingUp(false);
    }
  }

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  const totalIn = transactions
    .filter((t) => t.rawType === "DEPOSIT" || t.type === "DEPOSIT" || t.type === "TRANSFER_IN")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalOut = transactions
    .filter((t) => t.rawType === "WITHDRAWAL" || t.type === "WITHDRAWAL" || t.type === "TRANSFER_OUT")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  function openForm(type) {
    setModalError("");
    setTransferReceipt(null);
    setBeneficiaryInfo(null);
    setLookupError("");
    setActiveForm(type);
    setAmount("");
    setTransferNote("");
    if (accounts.length > 0 && !fromAcc) {
      setFromAcc(String(accounts[0].number));
    }
  }

  function closeForm() {
    setActiveForm(null);
    setAmount("");
    setModalError("");
    setBeneficiaryInfo(null);
    setLookupError("");
    setSubmitting(false);
  }

  async function handleConfirmTransaction() {
    setModalError("");

    if (activeForm === "OPEN_ACCOUNT") {
      const initial = amount ? Number(amount) : 0;
      if (initial < 0) {
        setModalError("Initial deposit cannot be negative");
        return;
      }
      setSubmitting(true);
      try {
        await api.createAccount(initial);
        await loadData();
        closeForm();
      } catch (err) {
        setModalError(err.message || "Failed to open savings account");
        setSubmitting(false);
      }
      return;
    }

    const value = Number(amount);
    if (!value || value <= 0) {
      setModalError("Please enter a valid amount greater than 0");
      return;
    }

    if (!fromAcc) {
      setModalError("Please select a valid account");
      return;
    }

    setSubmitting(true);

    try {
      if (activeForm === "DEPOSIT") {
        await api.deposit(fromAcc, value);
        await loadData();
        closeForm();
      } else if (activeForm === "WITHDRAWAL") {
        await api.withdraw(fromAcc, value);
        await loadData();
        closeForm();
      } else if (activeForm === "TRANSFER") {
        if (!toAcc) {
          setModalError("Please enter beneficiary account number");
          setSubmitting(false);
          return;
        }

        const resolvedTo = parseAccountNumber(toAcc);
        if (String(fromAcc) === String(resolvedTo)) {
          setModalError("Cannot transfer funds to the exact same account");
          setSubmitting(false);
          return;
        }

        const res = await api.transfer(fromAcc, resolvedTo, value, transferNote);
        await loadData();
        setTransferReceipt(res);
        setSubmitting(false);
      }
    } catch (err) {
      setModalError(err.message || "Transaction failed");
      setSubmitting(false);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess("");
    try {
      const res = await api.updateProfile({
        phone: editPhone,
        address: editAddress,
      });
      if (res.customer) {
        setCurrentUser(res.customer);
      }
      setProfileSuccess("Contact information updated successfully.");
      setEditingProfile(false);
    } catch (err) {
      alert(err.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  }

  const primaryAccount = accounts.length > 0 ? accounts[0] : null;

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesFilter =
      txFilter === "ALL" ||
      t.rawType === txFilter ||
      t.type === txFilter ||
      (txFilter === "TRANSFER" && (t.type === "TRANSFER_IN" || t.type === "TRANSFER_OUT"));

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      t.detail?.toLowerCase().includes(query) ||
      t.type?.toLowerCase().includes(query) ||
      String(t.amount).includes(query) ||
      t.date?.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#64748b", fontWeight: 600, fontSize: "14px" }}>Connecting to Core Banking...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar
        user={currentUser}
        onLogout={onLogout}
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); setModalError(""); }}
      />

      <main className="dashboard">
        {/* ========================================================
            TAB 1: OVERVIEW
            ======================================================== */}
        {activeTab === "overview" && (
          <div className="tab-pane">
            <section className="welcome">
              <h1>
                {greeting}, {currentUser?.firstName || "Customer"}
              </h1>
              <p>Here is the financial overview of your digital banking portfolio.</p>
            </section>

            {/* Hero Net Balance Banner */}
            <section className="hero">
              <div className="hero-top">
                <div>
                  <p className="hero-label">Net Available Savings</p>
                  <h2 className="hero-amount">
                    ₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                  <p className="hero-sub">
                    Across {accounts.length} active Savings {accounts.length === 1 ? "account" : "accounts"}
                  </p>
                </div>
                <button
                  className="hero-btn"
                  onClick={() => openForm("OPEN_ACCOUNT")}
                >
                  Open Savings Account
                </button>
              </div>

              <div className="hero-actions">
                <button
                  className="hero-btn"
                  onClick={() => setActiveTab("transfer")}
                  disabled={accounts.length === 0}
                >
                  Send Money
                </button>
                <button
                  className="hero-btn"
                  onClick={() => openForm("DEPOSIT")}
                  disabled={accounts.length === 0}
                >
                  Deposit Money
                </button>
                <button
                  className="hero-btn"
                  onClick={() => openForm("WITHDRAWAL")}
                  disabled={accounts.length === 0}
                >
                  Withdraw Cash
                </button>
              </div>
            </section>

            {/* Financial Stats */}
            <section className="stats-grid">
              <div className="stat-card">
                <div>
                  <p className="stat-label">Total Inflow</p>
                  <p className="stat-value">₹{totalIn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                </div>
                <span className="stat-tag green">Credit</span>
              </div>
              <div className="stat-card">
                <div>
                  <p className="stat-label">Total Outflow</p>
                  <p className="stat-value">₹{totalOut.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                </div>
                <span className="stat-tag red">Debit</span>
              </div>
              <div className="stat-card">
                <div>
                  <p className="stat-label">Settled Transactions</p>
                  <p className="stat-value">{transactions.length}</p>
                </div>
                <span className="stat-tag neutral">Volume</span>
              </div>
            </section>

            {/* Active Accounts Grid */}
            <section style={{ marginTop: "32px" }}>
              <div className="section-head-row">
                <h3 className="section-title" style={{ margin: 0 }}>Active Savings Accounts</h3>
                <button className="action-link-btn" onClick={() => setActiveTab("cards")}>
                  Manage Cards and Specifications
                </button>
              </div>

              {accounts.length === 0 ? (
                <div className="empty" style={{ background: "white", borderRadius: "16px", padding: "36px", border: "1px solid #e2e8f0" }}>
                  <p className="empty-title">No Savings Accounts Yet</p>
                  <p className="empty-sub">Open your first digital savings account to begin depositing and transferring.</p>
                  <button
                    className="confirm-btn"
                    style={{ width: "auto", margin: "16px auto 0", padding: "10px 24px" }}
                    onClick={() => openForm("OPEN_ACCOUNT")}
                  >
                    Open Digital Savings Account
                  </button>
                </div>
              ) : (
                <div className="accounts-grid">
                  {accounts.map((a) => (
                    <div key={a.number} className="bank-card card-savings">
                      <div className="bank-card-top">
                        <span className="chip"></span>
                        <span className="bank-card-type">SAVINGS ACCOUNT</span>
                      </div>
                      <p className="bank-card-number">
                        {maskAccountNumber(a.number)}
                      </p>
                      <div className="bank-card-bottom">
                        <div>
                          <small>Account #{formatAccountNumber(a.number)}</small>
                          <p>₹{Number(a.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                        </div>
                        <span className="bank-card-brand">ApexTrust</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Activity */}
            <section className="card" style={{ marginTop: "36px" }}>
              <div className="card-head">
                <h3>Recent Activity Feed</h3>
                <button className="action-link-btn" onClick={() => setActiveTab("statements")}>
                  View Full Statement ({transactions.length})
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="empty">
                  <p className="empty-title">No transactions recorded yet</p>
                  <p className="empty-sub">Make your first deposit or transfer to see your statement here.</p>
                </div>
              ) : (
                <ul className="transaction-list">
                  {transactions.slice(0, 5).map((t) => {
                    const isCredit = t.type?.includes("DEPOSIT") || t.type === "TRANSFER_IN";
                    return (
                      <li key={t.id}>
                        <div className="tx-left">
                          <span className={`tx-tag ${isCredit ? "green" : "red"}`}>
                            {isCredit ? "CR" : "DR"}
                          </span>
                          <div>
                            <p className="tx-title">{t.detail}</p>
                            <p className="tx-meta">{t.date}</p>
                          </div>
                        </div>
                        <span className={`tx-amount ${isCredit ? "green" : "red"}`}>
                          {isCredit ? "+" : "-"}₹{Number(t.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}

        {/* ========================================================
            TAB 2: ACCOUNTS & VIRTUAL CARD
            ======================================================== */}
        {activeTab === "cards" && (
          <div className="tab-pane">
            <section className="welcome">
              <h1>Accounts and Platinum Debit Card</h1>
              <p>Official banking credentials, contactless virtual debit card, and account specifications.</p>
            </section>

            {primaryAccount ? (
              <div className="cards-layout">
                {/* Virtual Card */}
                <div>
                  <div className="virtual-debit-card">
                    <div className="card-top">
                      <div className="card-chip-container">
                        <div className="emv-chip"></div>
                        <span className="contactless-tag">Contactless</span>
                      </div>
                      <span className="card-bank-name">ApexTrust Bank</span>
                    </div>

                    <div className="card-middle">
                      <p className="card-pan-number">
                        {formatAccountNumber(primaryAccount.number)}
                      </p>
                      <span className="card-tier-label">VISA PLATINUM DEBIT</span>
                    </div>

                    <div className="card-bottom">
                      <div>
                        <p className="card-holder-name">
                          {currentUser?.firstName} {currentUser?.lastName}
                        </p>
                        <small style={{ fontSize: "9px", opacity: 0.8 }}>PRIMARY SAVINGS</small>
                      </div>

                      <div className="card-meta-group">
                        <div>
                          <p className="card-meta-sub">VALID THRU</p>
                          <p className="card-meta-val">12/31</p>
                        </div>
                        <div>
                          <p className="card-meta-sub">CVV</p>
                          <p
                            className="card-meta-val"
                            style={{ cursor: "pointer", textDecoration: "underline" }}
                            onClick={() => setShowCvv(!showCvv)}
                          >
                            {showCvv ? "789" : "Show"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p style={{ textAlign: "center", fontSize: "12px", color: "#64748b", marginTop: "12px" }}>
                    Select CVV to toggle visibility. Protected by 256-bit banking encryption.
                  </p>
                </div>

                {/* Account Details & Specifications */}
                <div className="account-specs-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>Digital Savings Specifications</h3>
                    <span className="kyc-verified-pill">Active and Verified</span>
                  </div>

                  <div className="specs-grid">
                    <div className="spec-item">
                      <label>Account Number</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="spec-val" style={{ fontFamily: "monospace" }}>
                          {formatAccountNumber(primaryAccount.number)}
                        </span>
                        <span className="copy-pill" onClick={() => copyToClipboard(formatAccountNumber(primaryAccount.number))}>
                          {copiedAccount ? "Copied" : "Copy"}
                        </span>
                      </div>
                    </div>

                    <div className="spec-item">
                      <label>Account Type</label>
                      <span className="spec-val">Digital Savings Account</span>
                    </div>

                    <div className="spec-item">
                      <label>IFSC Code</label>
                      <span className="spec-val" style={{ fontFamily: "monospace" }}>APEX0008080</span>
                    </div>

                    <div className="spec-item">
                      <label>Branch Location</label>
                      <span className="spec-val">Central Digital Hub</span>
                    </div>

                    <div className="spec-item">
                      <label>Annual Interest Rate</label>
                      <span className="spec-val" style={{ color: "#16a34a" }}>4.50% p.a.</span>
                    </div>

                    <div className="spec-item">
                      <label>Daily Transfer Limit</label>
                      <span className="spec-val">₹5,00,000.00</span>
                    </div>
                  </div>

                  <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: "12px" }}>
                    <button className="confirm-btn" style={{ padding: "10px 20px" }} onClick={() => setActiveTab("transfer")}>
                      Transfer From This Account
                    </button>
                    <button
                      className="confirm-btn"
                      style={{ background: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0", boxShadow: "none" }}
                      onClick={() => openForm("DEPOSIT")}
                    >
                      Deposit Funds
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty" style={{ background: "white", borderRadius: "16px", padding: "36px" }}>
                <p>No active accounts found.</p>
                <button className="confirm-btn" style={{ width: "auto" }} onClick={() => openForm("OPEN_ACCOUNT")}>
                  Open an Account
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: TRANSFER & PAY
            ======================================================== */}
        {activeTab === "transfer" && (
          <div className="tab-pane">
            <section className="welcome">
              <h1>Transfer and Immediate Pay</h1>
              <p>Send funds instantly to any beneficiary account with real-time verification.</p>
            </section>

            <div className="transfer-container">
              {transferReceipt ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <h2 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "20px" }}>Transfer Completed Successfully</h2>
                  <p style={{ color: "#64748b", margin: "0 0 24px", fontSize: "14px" }}>{transferReceipt.message}</p>

                  <div style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "18px",
                    textAlign: "left",
                    marginBottom: "24px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                      <span style={{ color: "#64748b" }}>Reference ID:</span>
                      <strong style={{ fontFamily: "monospace" }}>{transferReceipt.referenceId}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                      <span style={{ color: "#64748b" }}>Recipient:</span>
                      <strong>{transferReceipt.recipientName}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "#64748b" }}>Updated Available Balance:</span>
                      <strong style={{ color: "#16a34a" }}>
                        ₹{Number(transferReceipt.fromAccountBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>

                  <button
                    className="confirm-btn"
                    onClick={() => { setTransferReceipt(null); setAmount(""); setToAcc(""); }}
                  >
                    Send Another Payment
                  </button>
                </div>
              ) : (
                <>
                  {modalError && (
                    <div style={{
                      background: "#fef2f2",
                      border: "1px solid #fee2e2",
                      color: "#dc2626",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "20px"
                    }}>
                      {modalError}
                    </div>
                  )}

                  <div className="field-group" style={{ marginBottom: "20px" }}>
                    <label>Debiting Savings Account</label>
                    <select
                      value={fromAcc}
                      onChange={(e) => setFromAcc(e.target.value)}
                      style={{ padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                    >
                      {accounts.map((a) => (
                        <option key={a.number} value={a.number}>
                          Savings Account #{formatAccountNumber(a.number)} — Available: ₹{Number(a.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field-group" style={{ marginBottom: "20px" }}>
                    <label>Beneficiary Account Number (e.g. 0723100104)</label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input
                        type="text"
                        placeholder="Enter 10-digit account number"
                        value={toAcc}
                        onChange={(e) => {
                          setToAcc(e.target.value);
                          verifyBeneficiary(e.target.value);
                        }}
                        style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="confirm-btn"
                        style={{ width: "auto", padding: "0 18px", fontSize: "13px" }}
                        onClick={() => verifyBeneficiary(toAcc)}
                        disabled={lookingUp || !toAcc}
                      >
                        {lookingUp ? "Checking..." : "Verify"}
                      </button>
                    </div>

                    {beneficiaryInfo && (
                      <div className="transfer-beneficiary-check">
                        <span>Verified Beneficiary:</span>
                        <strong>{beneficiaryInfo.holderName}</strong>
                        {beneficiaryInfo.isOwnAccount && <span>(Own Account)</span>}
                      </div>
                    )}

                    {lookupError && (
                      <div className="transfer-beneficiary-error">
                        <span>{lookupError}</span>
                      </div>
                    )}
                  </div>

                  {accounts.length > 1 && (
                    <div style={{ marginBottom: "20px" }}>
                      <small style={{ color: "#64748b", fontWeight: 600 }}>Quick transfer to your other account:</small>
                      <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                        {accounts.filter(a => String(a.number) !== String(fromAcc)).map(a => (
                          <button
                            key={a.number}
                            type="button"
                            className="amount-chip"
                            onClick={() => {
                              const fmt = formatAccountNumber(a.number);
                              setToAcc(fmt);
                              verifyBeneficiary(fmt);
                            }}
                          >
                            Savings #{formatAccountNumber(a.number)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="field-group" style={{ marginBottom: "20px" }}>
                    <label>Transfer Amount (INR)</label>
                    <div className="amount-input">
                      <span>₹</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div className="chips">
                      {[500, 1000, 5000, 10000].map((n) => (
                        <button key={n} type="button" className="amount-chip" onClick={() => setAmount(String(n))}>
                          ₹{n.toLocaleString("en-IN")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field-group" style={{ marginBottom: "26px" }}>
                    <label>Payment Remark / Reference (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Rent, Groceries, Dinner, Invoice"
                      value={transferNote}
                      onChange={(e) => setTransferNote(e.target.value)}
                      style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                    />
                  </div>

                  <button
                    className="confirm-btn"
                    onClick={handleConfirmTransaction}
                    disabled={submitting || accounts.length === 0}
                  >
                    {submitting ? "Processing Fund Transfer..." : "Authorize and Send Payment"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: STATEMENTS & PASSBOOK (EVEN TYPOGRAPHY & CSV DOWNLOAD)
            ======================================================== */}
        {activeTab === "statements" && (
          <div className="tab-pane">
            <section className="welcome">
              <h1>Official Account Statements</h1>
              <p>Audit transaction ledger with even typography and downloadable CSV mini statement.</p>
            </section>

            <div className="card">
              <div className="statement-controls">
                <div className="filter-pills">
                  {["ALL", "DEPOSIT", "WITHDRAWAL", "TRANSFER"].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      className={`filter-pill ${txFilter === filter ? "active" : ""}`}
                      onClick={() => setTxFilter(filter)}
                    >
                      {filter === "ALL" ? "All Activity" : filter === "TRANSFER" ? "Transfers" : `${filter}s`}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <div className="search-input-box">
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "12px" }}
                        onClick={() => setSearchQuery("")}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* DOWNLOAD MINI STATEMENT (.CSV) FEATURE */}
                  <button
                    type="button"
                    className="download-btn"
                    onClick={() => downloadMiniStatementCSV(
                      transactions,
                      primaryAccount?.number || 1001,
                      `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`
                    )}
                    disabled={transactions.length === 0}
                  >
                    Download Mini Statement (.csv)
                  </button>
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="empty">
                  <p className="empty-title">No transactions match your search</p>
                  <p className="empty-sub">Try adjusting the filter or search keywords.</p>
                </div>
              ) : (
                <div className="statement-table-wrap">
                  <table className="statement-table">
                    <thead>
                      <tr>
                        <th>Date and Time</th>
                        <th>Type</th>
                        <th>Particulars / Details</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((t) => {
                        const isCredit = t.type?.includes("DEPOSIT") || t.type === "TRANSFER_IN";
                        return (
                          <tr key={t.id}>
                            <td style={{ color: "#64748b" }}>{t.date}</td>
                            <td>
                              <span className={`type-badge ${isCredit ? "credit" : "debit"}`}>
                                {t.rawType || t.type}
                              </span>
                            </td>
                            <td>
                              {t.detail}
                            </td>
                            <td>
                              <span className="status-badge">Settled</span>
                            </td>
                            <td className={`amount-cell ${isCredit ? "credit" : "debit"}`}>
                              {isCredit ? "+" : "-"}₹{Number(t.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: PROFILE & KYC
            ======================================================== */}
        {activeTab === "profile" && (
          <div className="tab-pane">
            <section className="welcome">
              <h1>Customer Profile and Records</h1>
              <p>Official Know-Your-Customer (KYC) identity record with ApexTrust Digital Bank.</p>
            </section>

            <div className="profile-card-full">
              <div className="profile-top-banner">
                <div className="profile-avatar-lg">
                  {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}
                </div>
                <div className="profile-name-box">
                  <h2>{currentUser?.firstName} {currentUser?.lastName}</h2>
                  <div className="profile-meta-chips">
                    <span className="kyc-verified-pill">Tier-2 KYC Verified</span>
                    <span className="customer-id-pill">ID: APEX-{currentUser?.customerId || "1001"}</span>
                  </div>
                </div>
              </div>

              {profileSuccess && (
                <div style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "20px"
                }}>
                  {profileSuccess}
                </div>
              )}

              {editingProfile ? (
                <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="form-row">
                    <div className="field-group">
                      <label>Mobile Contact Number</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field-group">
                      <label>Residential Address</label>
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                    <button type="submit" className="confirm-btn" style={{ width: "auto", padding: "11px 24px" }} disabled={profileSaving}>
                      {profileSaving ? "Saving Updates..." : "Save Profile"}
                    </button>
                    <button
                      type="button"
                      className="confirm-btn"
                      style={{ width: "auto", padding: "11px 20px", background: "#f1f5f9", color: "#475569", boxShadow: "none" }}
                      onClick={() => setEditingProfile(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-info-grid">
                  <div className="profile-field-box">
                    <label>Registered Email Address</label>
                    <p className="profile-val">{currentUser?.email}</p>
                  </div>

                  <div className="profile-field-box">
                    <label>Verified Mobile Number</label>
                    <p className="profile-val">{currentUser?.phone || "Not recorded"}</p>
                  </div>

                  <div className="profile-field-box">
                    <label>PAN / Tax Identification</label>
                    <p className="profile-val" style={{ fontFamily: "monospace" }}>{currentUser?.panNumber || "VERIFIED-PAN"}</p>
                  </div>

                  <div className="profile-field-box">
                    <label>Date of Birth</label>
                    <p className="profile-val">{currentUser?.dateOfBirth || "Recorded on file"}</p>
                  </div>

                  <div className="profile-field-box" style={{ gridColumn: "1 / -1" }}>
                    <label>Permanent Residential Address</label>
                    <p className="profile-val">{currentUser?.address || "Address on file"}</p>
                  </div>
                </div>
              )}

              {!editingProfile && (
                <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #f1f5f9" }}>
                  <button
                    className="action-link-btn"
                    onClick={() => setEditingProfile(true)}
                  >
                    Edit Contact Information
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
          GLOBAL ACTION MODALS (DEPOSIT, WITHDRAW, NEW SAVINGS ACCOUNT)
          ======================================================== */}
      {activeForm && (
        <div className="overlay" onClick={closeForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeForm}>Close</button>

            <h2>
              {activeForm === "OPEN_ACCOUNT" ? "Open Digital Savings Account" :
               activeForm === "DEPOSIT" ? "Deposit Funds" :
               activeForm === "WITHDRAWAL" ? "Withdraw Cash" : "Fund Transfer"}
            </h2>

            <p className="modal-sub">
              {activeForm === "OPEN_ACCOUNT" ? "Create an interest-bearing Savings account with instant digital onboarding." :
               activeForm === "DEPOSIT" ? "Credit money into your active Savings account." :
               activeForm === "WITHDRAWAL" ? "Withdraw cash balance from your active Savings account." :
               "Transfer funds securely to any account."}
            </p>

            {modalError && (
              <p style={{
                background: "#fef2f2",
                border: "1px solid #fee2e2",
                color: "#dc2626",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                margin: "0 0 16px"
              }}>
                {modalError}
              </p>
            )}

            {activeForm === "OPEN_ACCOUNT" ? (
              <>
                <label className="field-label">Account Category</label>
                <input
                  type="text"
                  value="DIGITAL SAVINGS ACCOUNT (4.50% p.a.)"
                  disabled
                  style={{
                    background: "#f8fafc",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontWeight: 600,
                    color: "#4f46e5"
                  }}
                />

                <label className="field-label" style={{ marginTop: "16px" }}>Initial Opening Deposit (INR)</label>
                <div className="amount-input">
                  <span>₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                  />
                </div>
              </>
            ) : (
              <>
                <label className="field-label">Active Savings Account</label>
                <select value={fromAcc} onChange={(e) => setFromAcc(e.target.value)}>
                  {accounts.map((a) => (
                    <option key={a.number} value={a.number}>
                      Savings Account #{formatAccountNumber(a.number)} — Available: ₹{Number(a.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>

                <label className="field-label">Amount (INR)</label>
                <div className="amount-input">
                  <span>₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="chips">
                  {[500, 1000, 5000].map((n) => (
                    <button key={n} type="button" className="amount-chip" onClick={() => setAmount(String(n))}>
                      ₹{n.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
              </>
            )}

            <button
              className="confirm-btn"
              onClick={handleConfirmTransaction}
              disabled={submitting}
            >
              {submitting ? "Processing..." : "Confirm and Authorize"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
