"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          <span className="password-input">
            <input
              autoComplete="current-password"
              autoFocus
              onChange={(event) => setPassword(event.target.value)}
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              title={showPassword ? "Hide password" : "Show password"}
              type="button"
            >
              {showPassword ? (
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5.5 9 5.5a15.4 15.4 0 0 1-3 3.6M6.6 6.6C4.3 8.1 3 9.5 3 9.5S6.5 15 12 15c.7 0 1.4-.1 2-.3" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M3 12s3.5-5.5 9-5.5 9 5.5 9 5.5-3.5 5.5-9 5.5S3 12 3 12Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              )}
            </button>
          </span>
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
