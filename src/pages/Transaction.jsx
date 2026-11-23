
function Transactions() {
  const transactions = [
    {
      id: 1,
      date: "18 Nov 2026",
      type: "Deposit",
      amount: 2000,
    },
    {
      id: 2,
      date: "17 Nov 2026",
      type: "Withdrawal",
      amount: -500,
    },
    {
      id: 3,
      date: "16 Nov 2026",
      type: "Deposit",
      amount: 1000,
    },
  ];

  return (
    <div className="dashboard">
      <h1>Transaction History</h1>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((item) => (
            <tr key={item.id}>
              <td>{item.date}</td>
              <td>{item.type}</td>
              <td>₹{Math.abs(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Transactions;
