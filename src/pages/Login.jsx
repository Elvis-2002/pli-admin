import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (user) {
    return <Navigate to={location.state?.from || "/"} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError("Incorrect email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-6">
      <div className="w-full max-w-sm rounded-card bg-cream p-8">
        <div className="flex items-center gap-3">
          <img src="/icon-192.png" alt="" className="h-10 w-10 rounded-sm" />
          <div>
            <p className="font-eyebrow text-[11px] text-crimson">Admin</p>
            <h1 className="font-display text-lg font-semibold text-navy">
              Promised Land Initiative
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="font-eyebrow text-xs text-navy/60">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-sm border border-navy/20 bg-white px-4 py-3 text-sm outline-none focus:border-crimson"
            />
          </div>
          <div>
            <label htmlFor="password" className="font-eyebrow text-xs text-navy/60">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-sm border border-navy/20 bg-white px-4 py-3 text-sm outline-none focus:border-crimson"
            />
          </div>

          {error && <p className="text-sm text-crimson">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-sm bg-navy px-6 py-3 font-eyebrow text-xs text-cream transition-colors hover:bg-navy-2 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink/50">
          Accounts are created by the site administrator — there is no
          public sign-up.
        </p>
      </div>
    </div>
  );
}
