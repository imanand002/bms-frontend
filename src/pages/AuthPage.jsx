import { useState } from "react";

function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const form = e.target;
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    // Get existing registered users from localStorage
    const savedUsers = JSON.parse(localStorage.getItem("apextrust_users") || "[]");

    if (!isLogin) {
      const name = form.name.value.trim();
      const phone = form.phone.value.trim();
      const confirmPassword = form.confirmPassword.value;

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      if (savedUsers.some((u) => u.email === email)) {
        setError("An account with this email already exists.");
        return;
      }

      const newUser = { name, phone, email, password };
      localStorage.setItem("apextrust_users", JSON.stringify([...savedUsers, newUser]));

      setSuccess("Account created! You can now sign in.");
      setIsLogin(true);
      form.reset();
      return;
    }

    // Check credentials on Login
    const matchedUser = savedUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!matchedUser) {
      setError("Invalid email or password. Please create an account first.");
      return;
    }

    setSuccess(`Welcome back, ${matchedUser.name}!`);
    if (onLoginSuccess) {
      setTimeout(() => onLoginSuccess(matchedUser), 600);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-indigo-100/60 overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-100">
        
        {/* Left Branded Showcase Panel */}
        <div className="lg:col-span-5 relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 sm:p-10 text-white flex flex-col justify-between overflow-hidden">
          <div className="absolute -right-12 -bottom-16 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-12 -bottom-24 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xl border border-white/25">
                A
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight block leading-none">
                  ApexTrust
                </span>
                <span className="text-xs text-indigo-100">Digital Banking</span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-md border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Secure
            </span>
          </div>

          <div className="relative z-10 my-12 lg:my-0">
            <h2 className="text-3xl font-bold leading-tight mb-4">
              {isLogin
                ? "Smart banking built for your everyday goals."
                : "Start your digital banking journey today."}
            </h2>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Manage multiple accounts, track deposits and withdrawals in
              real-time, and transfer funds securely with zero hassle.
            </p>
          </div>

          <div className="relative z-10 bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between text-xs text-indigo-100 mb-1">
              <span>INSTANT TRANSFERS</span>
              <span>24/7 SUPPORT</span>
            </div>
            <p className="text-sm font-medium text-white">
              Protected by 256-bit end-to-end encryption
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-none">ApexTrust</h1>
              <p className="text-xs text-slate-500">Digital Banking</p>
            </div>
          </div>

          <div className="inline-flex bg-slate-100 p-1 rounded-xl mb-8 self-start">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError("");
                setSuccess("");
              }}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                isLogin
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError("");
                setSuccess("");
              }}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                !isLogin
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {isLogin ? "Welcome back 👋" : "Open your ApexTrust account"}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {isLogin
                ? "Enter your credentials to access your dashboard."
                : "Fill in your details below to get started."}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Tanuja Bisht"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="9876543210"
                    pattern="[0-9]{10}"
                    title="Enter a valid 10-digit phone number"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@apextrust.com"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
              />
            </div>

            <div className={!isLogin ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : ""}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    minLength="6"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-14 text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    minLength="6"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
                  />
                </div>
              )}
            </div>

            {isLogin && (
              <div className="flex items-center justify-between text-sm pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setSuccess("Password reset link sent to your email.")
                  }
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:opacity-95 text-white font-semibold py-3.5 rounded-xl transition duration-200 shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              {isLogin ? "Sign In to Dashboard" : "Create ApexTrust Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;