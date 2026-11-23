
import { useState } from "react";
import "../styles/BankingForms.css";

function Withdraw() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  function handleWithdraw() {
    if (amount === "" || Number(amount) <= 0) {
      setMessage("Please enter a valid amount.");
      return;
    }

    setMessage("Withdrawal request entered: ₹" + amount);
  }

  return (
    <div className="bank-form">
      <h1>Withdraw Money</h1>

      <label>Enter Amount</label>

      <input
        type="number"
        min="0.01"
        step="0.01"
        placeholder="Enter amount in rupees"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />

      <button onClick={handleWithdraw}>
        Withdraw
      </button>

      <p>{message}</p>
    </div>
  );
}

export default Withdraw;
