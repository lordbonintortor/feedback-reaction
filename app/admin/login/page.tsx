"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function login(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setError(data.message || "Unable to sign in.");
      setSubmitting(false);
      return;
    }

    const requestedPath = new URLSearchParams(window.location.search).get("next");
    const destination = requestedPath?.startsWith("/admin") ? requestedPath : "/admin";
    router.replace(destination);
    router.refresh();
  }

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={login}>
        <Image alt="HRMDO" className="login-logo" height={76} src="/icon.png" width={76} />
        <p className="office-label">HRMDO Administration</p>
        <h1>Feedback Dashboard</h1>
        <p>Enter the administrator password to continue.</p>

        <label className="field login-field">
          <span>Password</span>
          <input
            autoComplete="current-password"
            autoFocus
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        {error ? <p className="login-error" role="alert">{error}</p> : null}

        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? "Signing in..." : "Sign In"}
        </button>
        <Link className="back-link" href="/">Return to feedback kiosk</Link>
      </form>
    </main>
  );
}
