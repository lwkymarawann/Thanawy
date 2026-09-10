"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = [
  { id: "admin", label: "Me" },
  { id: "gf", label: "Girlfriend" },
  { id: "mom", label: "Mom" },
];

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
      <div className="login-card">
        <div className="login-mark">Thanaweya Tracker</div>
        <h1>Sign in</h1>
        <p className="login-sub">Enter your PIN.</p>
        <form onSubmit={submit}>
          <div className="role-grid">
          
          </div>
          <div className="field">
            <label htmlFor="pin">PIN</label>
            <input id="pin" type="password" inputMode="numeric" autoFocus value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" />
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
