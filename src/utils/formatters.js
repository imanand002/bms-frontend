/**
 * Commercial 10-digit Account Number Formatter
 * Formats internal ID to realistic bank account number (e.g. 1001 -> "0723100104")
 */
export function formatAccountNumber(accNumber) {
  if (!accNumber) return "";
  const n = Number(accNumber);
  if (isNaN(n)) return String(accNumber);

  // If already formatted (10+ digits starting with 0723)
  const str = String(accNumber).trim();
  if (str.startsWith("0723") && str.length === 10) return str;

  if (n < 10000) {
    const padded = String(n).padStart(4, "0");
    return `0723${padded}04`;
  }
  return `0723${String(n).padStart(6, "0")}`;
}

export function maskAccountNumber(accNumber) {
  const formatted = formatAccountNumber(accNumber);
  if (formatted.length === 10) {
    return `${formatted.substring(0, 4)}••••${formatted.substring(8)}`;
  }
  return formatted;
}

export function parseAccountNumber(formatted) {
  if (!formatted) return "";
  const str = String(formatted).trim();
  if (str.startsWith("0723") && str.length === 10) {
    if (str.endsWith("04")) {
      const mid = parseInt(str.substring(4, 8), 10);
      if (!isNaN(mid)) return mid;
    }
    const raw = parseInt(str.substring(4), 10);
    if (!isNaN(raw)) return raw;
  }
  const n = parseInt(str, 10);
  return isNaN(n) ? str : n;
}

/**
 * Generates and triggers download of a clean .CSV Mini Statement (last 10 transactions)
 */
export function downloadMiniStatementCSV(transactions, accountNumber, customerName) {
  const recent10 = (transactions || []).slice(0, 10);
  const formattedAcc = formatAccountNumber(accountNumber);
  const dateStr = new Date().toISOString().split("T")[0];

  const headers = ["Transaction ID", "Date and Time", "Transaction Type", "Particulars / Detail", "Debit (INR)", "Credit (INR)", "Settlement Status"];

  const rows = recent10.map((t) => {
    const isCredit = t.type?.includes("DEPOSIT") || t.type === "TRANSFER_IN";
    const amountVal = Number(t.amount).toFixed(2);
    const debit = !isCredit ? amountVal : "0.00";
    const credit = isCredit ? amountVal : "0.00";
    const cleanDetail = (t.detail || "").replace(/"/g, '""');

    return [
      `TXN-${t.id}`,
      `"${t.date || ""}"`,
      `"${t.rawType || t.type}"`,
      `"${cleanDetail}"`,
      debit,
      credit,
      "Settled"
    ].join(",");
  });

  const metadata = [
    `ApexTrust Digital Bank - Official Mini Statement`,
    `Account Number: ${formattedAcc}`,
    `Account Holder: ${customerName || "Valued Customer"}`,
    `Generated On: ${new Date().toLocaleString("en-IN")}`,
    `Statement Period: Last 10 Settled Transactions`,
    ``
  ];

  const csvContent = [...metadata, headers.join(","), ...rows].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Mini_Statement_${formattedAcc}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
