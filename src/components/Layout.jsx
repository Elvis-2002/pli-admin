import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/gallery", label: "Gallery" },
  { to: "/programs", label: "Programs" },
  { to: "/team", label: "Team" },
  { to: "/stories", label: "Stories" },
  { to: "/events", label: "Events" },
  { to: "/prayer-requests", label: "Prayer Requests" },
  { to: "/settings", label: "Settings" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-sand">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <img
              src="/pli-admin/icon-192.png"
              alt="PLI Admin"
              className="h-8 w-8 rounded-sm"
            />

            <span className="font-display text-base font-semibold text-navy">
              PLI Admin
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="font-eyebrow text-[11px] text-navy/50 hover:text-crimson"
          >
            Sign Out
          </button>
        </div>

        <nav className="mx-auto flex max-w-5xl gap-6 overflow-x-auto px-5">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 py-3 font-eyebrow text-xs tracking-widest ${
                  isActive
                    ? "border-crimson text-crimson"
                    : "border-transparent text-ink/60 hover:text-navy"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {user && (
          <p className="mb-6 text-xs text-ink/40">
            Signed in as {user.email}
          </p>
        )}

        {children}
      </main>
    </div>
  );
}