import React, { useState, useMemo } from 'react';
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  InputAdornment,
  Avatar,
  Alert,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AccountBalanceWallet,
  TrendingUp,
  Logout,
  PersonAdd,
  Login,
} from '@mui/icons-material';

/* ---------- Constants & mock data ---------- */

const SESSION_KEY = 'bms_session_user';
const userKey = (email) => `user_${email}`;

const ACCOUNTS = [
  { accountNumber: 1001, accountType: 'CHECKING', balance: 5420.5 },
  { accountNumber: 1002, accountType: 'SAVINGS', balance: 12750.0 },
];

const TRANSACTIONS = [
  { id: 1, type: 'DEPOSIT', amount: 1200.0, target: 'Checking', date: '2026-11-01' },
  { id: 2, type: 'WITHDRAWAL', amount: 45.5, target: 'Checking', date: '2026-11-02' },
  { id: 3, type: 'TRANSFER', amount: 500.0, target: 'Savings', date: '2026-11-03' },
];

const TX_STYLES = {
  DEPOSIT: { sign: '+', color: 'text-green-600' },
  WITHDRAWAL: { sign: '-', color: 'text-red-600' },
  TRANSFER: { sign: '', color: 'text-blue-600' },
};

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/* ---------- Helpers ---------- */

const readJSON = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const sha256 = async (text) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
};

const randomSalt = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

const initials = (u) => `${u?.firstName?.[0] ?? ''}${u?.lastName?.[0] ?? ''}`.toUpperCase();

/* ---------- Auth screen ---------- */

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isLogin = mode === 'login';
  const setField = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const switchMode = () => {
    setMode(isLogin ? 'signup' : 'login');
    setError('');
    setForm((f) => ({ ...f, password: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const email = form.email.trim().toLowerCase();

      if (isLogin) {
        const record = readJSON(userKey(email));
        const hash = record && (await sha256(record.salt + form.password));
        // Same message for both failures: don't reveal which emails exist
        if (!record || hash !== record.passwordHash) {
          setError('Invalid email or password.');
          return;
        }
        onAuthenticated({ firstName: record.firstName, lastName: record.lastName, email });
      } else {
        if (form.password.length < 8) {
          setError('Password must be at least 8 characters.');
          return;
        }
        if (readJSON(userKey(email))) {
          setError('An account with this email already exists.');
          return;
        }
        const salt = randomSalt();
        const profile = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email,
        };
        localStorage.setItem(
          userKey(email),
          JSON.stringify({ ...profile, salt, passwordHash: await sha256(salt + form.password) })
        );
        onAuthenticated(profile);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4">
      <div className="mb-6 flex items-center space-x-2 text-white">
        <AccountBalanceWallet sx={{ color: '#3b82f6', fontSize: 36 }} />
        <Typography variant="h5" className="font-extrabold tracking-wider">
          Rahul Modi Cooperative Bank     </Typography>
      </div>

      <Card className="w-full sm:max-w-md shadow-2xl" sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" className="font-bold text-center" sx={{ mb: 3 }}>
            {isLogin ? 'Sign In to Your Account' : 'Create Banking Profile'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} role="alert">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <TextField label="First Name" fullWidth required autoComplete="given-name"
                  value={form.firstName} onChange={setField('firstName')} />
                <TextField label="Last Name" fullWidth required autoComplete="family-name"
                  value={form.lastName} onChange={setField('lastName')} />
              </div>
            )}

            <TextField label="Email Address" type="email" fullWidth required autoComplete="email"
              value={form.email} onChange={setField('email')} />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={form.password}
              onChange={setField('password')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((s) => !s)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={busy}
              startIcon={isLogin ? <Login /> : <PersonAdd />}
              sx={{ mt: 2, py: 1.5, borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
            >
              {isLogin ? 'Login' : 'Register Account'}
            </Button>
          </form>

          <div className="mt-6 text-center border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={switchMode}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({ user, onLogout }) {
  const total = useMemo(() => ACCOUNTS.reduce((sum, a) => sum + a.balance, 0), []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <nav className="bg-blue-600 text-white shadow-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <AccountBalanceWallet />
          <h1 className="text-xl font-bold tracking-wide">Rahul Modi Cooperative Bank</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-blue-700/50 border border-blue-400/20 px-3 py-1.5 rounded-lg space-x-2.5">
            <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#fff', color: '#2563eb', fontWeight: 700 }}>
              {initials(user)}
            </Avatar>
            <span className="text-sm font-medium">Welcome, {user.firstName} {user.lastName}</span>
          </div>
          <IconButton aria-label="Log out" onClick={onLogout} sx={{ color: '#fff' }}>
            <Logout />
          </IconButton>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 mt-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center justify-end gap-1">
              <TrendingUp sx={{ fontSize: 16, color: '#22c55e' }} /> Net Liquid Assets
            </p>
            <p className="text-3xl font-extrabold text-blue-600 mt-1">{currency.format(total)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <section className="md:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Active Core Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {ACCOUNTS.map((acc) => (
                <div key={acc.accountNumber}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl text-white shadow-md relative overflow-hidden">
                  <div className="absolute -right-5 -bottom-5 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
                  <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-500/30">
                    {acc.accountType}
                  </span>
                  <p className="text-xs text-slate-400 mt-4">Account •••• {String(acc.accountNumber).slice(-4)}</p>
                  <p className="text-2xl font-bold mt-1">{currency.format(acc.balance)}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-6">Recent Activity</h3>
            <ul className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
              {TRANSACTIONS.map((tx) => {
                const s = TX_STYLES[tx.type];
                return (
                  <li key={tx.id} className="flex justify-between items-center p-4">
                    <div>
                      <p className="text-sm font-semibold capitalize">{tx.type.toLowerCase()}</p>
                      <p className="text-xs text-gray-400">{tx.target} · {tx.date}</p>
                    </div>
                    <span className={`text-sm font-bold ${s.color}`}>
                      {s.sign}{currency.format(tx.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

/* ---------- Root ---------- */

export default function App() {
  // Lazy init: restores session before first render (no login-screen flash)
  const [currentUser, setCurrentUser] = useState(() => readJSON(SESSION_KEY));

  const handleAuthenticated = (profile) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    setCurrentUser(profile);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  };

  return currentUser ? (
    <Dashboard user={currentUser} onLogout={handleLogout} />
  ) : (
    <AuthScreen onAuthenticated={handleAuthenticated} />
  );
}
=======
import Dashboard from "./pages/Dashboard";

function App() {
  return <Dashboard />;
}

export default App;
>>>>>>> 120bae5cf5363c3bd17a6ef03f0cd2d6787f296f
