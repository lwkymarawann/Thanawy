"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconSun, IconMoon } from "../components/Icons";

const ROLES = [
  { id: "admin", label: "Me" },
  { id: "gf", label: "Girlfriend" },
  { id: "mom", label: "Mom" },
];

function ThemeToggle() {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") || "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("thanaweya-theme", next);
    } catch {}
  }

  if (!theme) return <div className="icon-btn theme-toggle-float" style={{ visibility: "hidden" }} />;

  return (
    <button className="icon-btn theme-toggle-float" onClick={toggle} aria-label="Toggle theme">
      {theme === "dark" ? <IconSun width={18} height={18} /> : <IconMoon width={18} height={18} />}
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("admin");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, pin }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Something went wrong");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <ThemeToggle />
      <div className="login-card">
        <div className="login-mark">Thanaweya Tracker</div>
        <h1>Sign in</h1>
        <p className="login-sub">Pick who you are, then enter your PIN.</p>
        <form onSubmit={submit}>
          <div className="role-grid">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.id}
                className={"role-btn" + (role === r.id ? " active" : "")}
                onClick={() => setRole(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="field">
            <label htmlFor="pin">PIN</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
            />
          </div>
          <div className="pin-dots">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={"pin-dot" + (i < pin.length ? " filled" : "")} />
            ))}
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 18 }} disabled={loading || !pin}>
            {loading ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
