const BASE_URL = "http://localhost:8080/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("bms_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "An error occurred while communicating with the bank server.");
  }

  return data;
}

export const api = {
  // Auth & Profile
  async register(profileData) {
    const data = await request("/register", {
      method: "POST",
      body: JSON.stringify(profileData),
    });
    if (data.token) {
      localStorage.setItem("bms_token", data.token);
    }
    return data;
  },

  async login(email, password) {
    const data = await request("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem("bms_token", data.token);
    }
    return data;
  },

  async logout() {
    try {
      await request("/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("bms_token");
    }
  },

  async getMe() {
    return request("/me");
  },

  async updateProfile(profileData) {
    return request("/profile", {
      method: "POST",
      body: JSON.stringify(profileData),
    });
  },

  getToken() {
    return localStorage.getItem("bms_token");
  },

  // Accounts (Savings only)
  async getAccounts() {
    const data = await request("/accounts");
    return data.accounts || [];
  },

  async createAccount(initialDeposit = 0) {
    return request("/accounts", {
      method: "POST",
      body: JSON.stringify({ accountType: "SAVINGS", initialDeposit }),
    });
  },

  async deleteAccount(accountNumber) {
    return request("/accounts", {
      method: "DELETE",
      body: JSON.stringify({ accountNumber }),
    });
  },

  async lookupAccount(accountNumber) {
    return request(`/accounts/lookup?number=${encodeURIComponent(accountNumber)}`);
  },

  // Transactions
  async deposit(accountNumber, amount) {
    return request("/transactions/deposit", {
      method: "POST",
      body: JSON.stringify({ accountNumber: Number(accountNumber), amount: Number(amount) }),
    });
  },

  async withdraw(accountNumber, amount) {
    return request("/transactions/withdraw", {
      method: "POST",
      body: JSON.stringify({ accountNumber: Number(accountNumber), amount: Number(amount) }),
    });
  },

  async transfer(fromAccount, toAccount, amount, note = "") {
    return request("/transactions/transfer", {
      method: "POST",
      body: JSON.stringify({
        fromAccount: Number(fromAccount),
        toAccount: Number(toAccount),
        amount: Number(amount),
        note: note ? note.trim() : "",
      }),
    });
  },

  async getTransactions() {
    const data = await request("/transactions");
    return data.transactions || [];
  },
};
