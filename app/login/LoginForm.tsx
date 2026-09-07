"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("That's not it — try again.");
        setBusy(false);
        return;
      }
      const next = searchParams.get("next") || "/home";
      router.push(next);
      router.refresh();
    } catch {
      setError("Couldn't reach the server — try again.");
      setBusy(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label htmlFor="ss-password">Password</label>
      <input
        id="ss-password"
        type="password"
        inputMode="numeric"
        autoFocus
        autoComplete="current-password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (error) setError("");
        }}
      />
      {error ? <div className="login-error">{error}</div> : null}
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
