
import { useState } from "react";

function Deposit() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  function handleDeposit() {
    if (amount === "" || Number(amount) <= 0) {
      setMessage("Please enter a valid amount.");
      return;
    }

    setMessage("Amount entered: ₹" + amount);
  }

  return (
    <div className="bank-form">
      <h1>Deposit Money</h1>

      <label>Enter Amount</label>

      <input
        type="number"
        placeholder="Enter amount in rupees"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />

      <button onClick={handleDeposit}>
        Deposit
      </button>

      <p>{message}</p>
    </div>
  );
}

export default Deposit;
