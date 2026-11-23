import { useState } from "react";
import Navbar from "../components/Navbar";
import "../styles/Dashboard.css";

function Dashboard({ user, onLogout }) {
  const [accounts, setAccounts] = useState([
    { number: 1001, type: "SAVINGS", balance: 25000 },
    { number: 1002, type: "CHECKING", balance: 5000 },
  ]);
  const [transactions, setTransactions] = useState([]);
  const [activeForm, setActiveForm] = useState(null); // null, DEPOSIT, WITHDRAWAL, TRANSFER
  const [amount, setAmount] = useState("");
  const [fromAcc, setFromAcc] = useState("1001");
  const [toAcc, setToAcc] = useState("1002");

  const total = accounts.reduce((sum, a) => sum + a.balance, 0);

  const totalIn = transactions
    .filter((t) => t.type === "DEPOSIT")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOut = transactions
    .filter((t) => t.type === "WITHDRAWAL")
    .reduce((sum, t) => sum + t.amount, 0);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  function openForm(type) {
    setActiveForm(type);
    setAmount("");
  }

  function closeForm() {
    setActiveForm(null);
    setAmount("");
  }

  function addTransaction(type, value, detail) {
    const newTx = {
      id: Date.now(),
      type,
      amount: value,
      detail,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
    setTransactions([newTx, ...transactions]);
  }

  function handleConfirm() {
    const value = Number(amount);

    if (!value || value <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const source = accounts.find((a) => a.number === Number(fromAcc));
    const label = `${source.type} #${source.number}`;

    if (activeForm === "DEPOSIT") {
      setAccounts(
        accounts.map((a) =>
          a.number === source.number ? { ...a, balance: a.balance + value } : a
        )
      );
      addTransaction("DEPOSIT", value, label);
    }

    if (activeForm === "WITHDRAWAL") {
      if (value > source.balance) {
        alert("Insufficient balance");
        return;
      }
      setAccounts(
        accounts.map((a) =>
          a.number === source.number ? { ...a, balance: a.balance - value } : a
        )
      );
      addTransaction("WITHDRAWAL", value, label);
    }

    if (activeForm === "TRANSFER") {
      if (fromAcc === toAcc) {
        alert("Choose two different accounts");
        return;
      }
      if (value > source.balance) {
        alert("Insufficient balance");
        return;
      }
      setAccounts(
        accounts.map((a) => {
          if (a.number === Number(fromAcc)) return { ...a, balance: a.balance - value };
          if (a.number === Number(toAcc)) return { ...a, balance: a.balance + value };
          return a;
        })
      );
      addTransaction("TRANSFER", value, `#${fromAcc} → #${toAcc}`);
    }

    closeForm();
  }

  function txIcon(type) {
    if (type === "DEPOSIT") return "↓";
    if (type === "WITHDRAWAL") return "↑";
    return "⇄";
  }

  function txColor(type) {
    if (type === "DEPOSIT") return "green";
    if (type === "WITHDRAWAL") return "red";
    return "blue";
  }

  function sign(type) {
    if (type === "DEPOSIT") return "+";
    if (type === "WITHDRAWAL") return "-";
    return "";
  }

  const formTitle = {
    DEPOSIT: "Deposit Money",
    WITHDRAWAL: "Withdraw Money",
    TRANSFER: "Transfer Funds",
  };

  const formSub = {
    DEPOSIT: "Add money to one of your accounts",
    WITHDRAWAL: "Take money out of one of your accounts",
    TRANSFER: "Move money between your accounts",
  };

  return (
    <div className="page">
      <Navbar user={user} onLogout={onLogout} />

      <main className="dashboard">
        {/* Greeting */}
        <section className="welcome">
          <h1>
            {greeting}, {user?.name?.split(" ")[0] || "User"} <span className="wave">👋</span>
          </h1>
          <p>Here is what is happening with your money today.</p>
        </section>

        {/* Hero */}
        <section className="hero">
          <div className="hero-top">
            <div>
              <p className="hero-label">Total Balance</p>
              <h2 className="hero-amount">₹{total.toLocaleString("en-IN")}</h2>
              <p className="hero-sub">Across {accounts.length} active accounts</p>
            </div>
            <span className="hero-badge">● Secure</span>
          </div>

          <div className="hero-actions">
            <button className="hero-btn" onClick={() => openForm("DEPOSIT")}>
              <span className="hero-btn-icon">↓</span> Deposit
            </button>
            <button className="hero-btn" onClick={() => openForm("WITHDRAWAL")}>
              <span className="hero-btn-icon">↑</span> Withdraw
            </button>
            <button className="hero-btn" onClick={() => openForm("TRANSFER")}>
              <span className="hero-btn-icon">⇄</span> Transfer
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon green">↓</span>
            <div>
              <p className="stat-label">Total Deposited</p>
              <p className="stat-value">₹{totalIn.toLocaleString("en-IN")}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon red">↑</span>
            <div>
              <p className="stat-label">Total Withdrawn</p>
              <p className="stat-value">₹{totalOut.toLocaleString("en-IN")}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon purple">#</span>
            <div>
              <p className="stat-label">Transactions</p>
              <p className="stat-value">{transactions.length}</p>
            </div>
          </div>
        </section>

        {/* Accounts */}
        <section>
          <h3 className="section-title">Your Accounts</h3>
          <div className="accounts-grid">
            {accounts.map((a) => (
              <div
                key={a.number}
                className={`bank-card ${
                  a.type === "SAVINGS" ? "card-savings" : "card-checking"
                }`}
              >
                <div className="bank-card-top">
                  <span className="chip"></span>
                  <span className="bank-card-type">{a.type}</span>
                </div>
                <p className="bank-card-number">•••• •••• •••• {a.number}</p>
                <div className="bank-card-bottom">
                  <div>
                    <small>Available Balance</small>
                    <p>₹{a.balance.toLocaleString("en-IN")}</p>
                  </div>
                  <span className="bank-card-brand">ApexTrust</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Transactions */}
        <section className="card">
          <div className="card-head">
            <h3>Recent Transactions</h3>
            <span className="count-pill">{transactions.length} total</span>
          </div>

          {transactions.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">💳</div>
              <p className="empty-title">No transactions yet</p>
              <p className="empty-sub">
                Make a deposit, withdrawal or transfer to see it here.
              </p>
            </div>
          ) : (
            <ul className="transaction-list">
              {transactions.map((t) => (
                <li key={t.id}>
                  <div className="tx-left">
                    <span className={`tx-icon ${txColor(t.type)}`}>
                      {txIcon(t.type)}
                    </span>
                    <div>
                      <p className="tx-title">{t.type}</p>
                      <p className="tx-meta">
                        {t.detail} • {t.date}
                      </p>
                    </div>
                  </div>
                  <span className={`tx-amount ${txColor(t.type)}`}>
                    {sign(t.type)}₹{t.amount.toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Popup form */}
      {activeForm && (
        <div className="overlay" onClick={closeForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeForm}>
              ✕
            </button>

            <h2>{formTitle[activeForm]}</h2>
            <p className="modal-sub">{formSub[activeForm]}</p>

            <label className="field-label">
              {activeForm === "TRANSFER" ? "From account" : "Account"}
            </label>
            <select value={fromAcc} onChange={(e) => setFromAcc(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.number} value={a.number}>
                  {a.type} #{a.number} — ₹{a.balance.toLocaleString("en-IN")}
                </option>
              ))}
            </select>

            {activeForm === "TRANSFER" && (
              <>
                <label className="field-label">To account</label>
                <select value={toAcc} onChange={(e) => setToAcc(e.target.value)}>
                  {accounts.map((a) => (
                    <option key={a.number} value={a.number}>
                      {a.type} #{a.number}
                    </option>
                  ))}
                </select>
              </>
            )}

            <label className="field-label">Amount</label>
            <div className="amount-input">
              <span>₹</span>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>

            <div className="chips">
              {[500, 1000, 5000].map((n) => (
                <button key={n} className="amount-chip" onClick={() => setAmount(String(n))}>
                  ₹{n.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            <button className="confirm-btn" onClick={handleConfirm}>
              Confirm {formTitle[activeForm]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;