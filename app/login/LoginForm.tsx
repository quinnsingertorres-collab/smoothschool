"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, authErrorMessage, USERNAME_RE, normalizeUsername } from "@/components/AuthProvider";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, configured, user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const next = searchParams.get("next") || "/home";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/home";

  // Already signed in (or no Firebase at all, so there's nothing to sign in to).
  useEffect(() => {
    if (ready && (user || !configured)) router.replace(safeNext);
  }, [ready, user, configured, router, safeNext]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const uname = normalizeUsername(username);
    if (!uname || !password) return;
    if (mode === "signup" && !USERNAME_RE.test(uname)) {
      setError("Usernames are 3–24 characters: letters, numbers, dot, dash or underscore.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (mode === "signin") await signIn(uname, password);
      else await signUp({ username: uname, password, displayName });
      // The effect above navigates once the auth state flips.
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  function switchMode(m: "signin" | "signup") {
    setMode(m);
    setError("");
  }

  return (
    <>
      <h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
      <p className="login-sub">
        {mode === "signin" ? "Sign in to see your classes." : "Your classes, homework and schedule — just for you."}
      </p>
      <form className="login-form" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <>
            <label htmlFor="ss-name">Your name</label>
            <input
              id="ss-name"
              type="text"
              autoComplete="given-name"
              maxLength={40}
              value={displayName}
              placeholder="Quinn"
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </>
        ) : null}
        <label htmlFor="ss-username">Username</label>
        <input
          id="ss-username"
          type="text"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (error) setError("");
          }}
        />
        <label htmlFor="ss-password">Password</label>
        <input
          id="ss-password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          minLength={mode === "signup" ? 6 : undefined}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError("");
          }}
        />
        {mode === "signup" ? <div className="login-hint">At least 6 characters.</div> : null}
        {error ? <div className="login-error">{error}</div> : null}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy || !ready}>
          {busy ? (mode === "signin" ? "Signing in…" : "Creating…") : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
      <div className="login-switch">
        {mode === "signin" ? (
          <>
            New here?{" "}
            <button type="button" onClick={() => switchMode("signup")}>
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have one?{" "}
            <button type="button" onClick={() => switchMode("signin")}>
              Sign in
            </button>
          </>
        )}
      </div>
    </>
  );
}
