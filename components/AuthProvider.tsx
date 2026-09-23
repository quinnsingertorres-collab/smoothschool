"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { applyTheme, normalizeTheme, type ThemePref } from "@/lib/theme";

// Accounts are username + password. Firebase Auth only speaks email, so
// each username maps to a made-up address on a domain nobody receives
// mail at -- the user never sees it. Uniqueness comes for free: Firebase
// won't create two accounts with the same email, so two people can't
// claim the same username.
const USERNAME_DOMAIN = "users.smoothschool.app";
export const USERNAME_RE = /^[a-z0-9._-]{3,24}$/;

export function normalizeUsername(u: string): string {
  return u.trim().toLowerCase();
}
function usernameToEmail(u: string): string {
  return `${normalizeUsername(u)}@${USERNAME_DOMAIN}`;
}

export interface Profile {
  username: string;
  displayName: string; // "Quinn"
  appName: string; // custom app title; "" means use the default
  theme?: ThemePref; // accent color + light/dark; synced so it follows the user across devices
}

export const DEFAULT_APP_NAME = "SmoothSchool";

// Custom name wins; otherwise "<Name>'s School"; otherwise the stock name.
export function resolveAppName(p: Pick<Profile, "displayName" | "appName"> | null): string {
  if (!p) return DEFAULT_APP_NAME;
  if (p.appName.trim()) return p.appName.trim();
  if (p.displayName.trim()) return defaultAppNameFor(p.displayName);
  return DEFAULT_APP_NAME;
}
export function defaultAppNameFor(displayName: string): string {
  const n = displayName.trim();
  if (!n) return DEFAULT_APP_NAME;
  return /s$/i.test(n) ? `${n}' School` : `${n}'s School`;
}

interface AuthContextValue {
  ready: boolean; // the first auth state check has come back
  configured: boolean; // Firebase is set up at all (if not, the app runs local-only, no login)
  user: User | null;
  profile: Profile | null;
  appName: string;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (input: { username: string; password: string; displayName: string }) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (patch: Partial<Omit<Profile, "username">>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// Turns Firebase's error codes into something a person can act on.
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Wrong username or password.";
    case "auth/email-already-in-use":
      return "That username is taken — try another.";
    case "auth/weak-password":
      return "Password needs at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many tries. Wait a minute and try again.";
    case "auth/network-request-failed":
      return "Couldn't reach the server. Check your connection.";
    case "auth/operation-not-allowed":
      return "Accounts aren't turned on yet (Firebase → Authentication → Email/Password).";
    default:
      return (err as Error)?.message || "Something went wrong. Try again.";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!firebaseReady);
  const [profile, setProfile] = useState<Profile | null>(null);
  // Local-only mode (no Firebase): settings just live in memory for this tab.
  const [localProfile, setLocalProfile] = useState<Profile>({ username: "", displayName: "", appName: "" });

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setProfile(null);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!db || !user) return;
    return onSnapshot(doc(db, "users", user.uid), (snap) => {
      const d = (snap.data() || {}) as Partial<Profile>;
      setProfile({
        username: d.username || (user.email || "").split("@")[0],
        displayName: d.displayName || "",
        appName: d.appName || "",
        theme: d.theme ? normalizeTheme(d.theme) : undefined,
      });
      // Their saved theme follows them to any device they sign in on.
      if (d.theme) applyTheme(normalizeTheme(d.theme));
    });
  }, [user]);

  const effectiveProfile = firebaseReady ? profile : localProfile;
  const appName = resolveAppName(effectiveProfile);

  useEffect(() => {
    document.title = appName;
  }, [appName]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      configured: firebaseReady,
      user,
      profile: effectiveProfile,
      appName,
      async signIn(username, password) {
        if (!auth) throw new Error("Firebase isn't configured.");
        await signInWithEmailAndPassword(auth, usernameToEmail(username), password);
      },
      async signUp({ username, password, displayName }) {
        if (!auth || !db) throw new Error("Firebase isn't configured.");
        const uname = normalizeUsername(username);
        if (!USERNAME_RE.test(uname)) {
          throw new Error("Usernames are 3–24 characters: letters, numbers, dot, dash or underscore.");
        }
        const cred = await createUserWithEmailAndPassword(auth, usernameToEmail(uname), password);
        await setDoc(doc(db, "users", cred.user.uid), {
          username: uname,
          displayName: displayName.trim(),
          appName: "",
          createdAt: new Date().toISOString(),
        });
      },
      async signOut() {
        if (auth) await fbSignOut(auth);
      },
      async saveProfile(patch) {
        if (patch.theme) applyTheme(patch.theme);
        if (!firebaseReady) {
          setLocalProfile((p) => ({ ...p, ...patch }));
          return;
        }
        if (!db || !user) return;
        await setDoc(doc(db, "users", user.uid), patch, { merge: true });
      },
    }),
    [ready, user, effectiveProfile, appName]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
