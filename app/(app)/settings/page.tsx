"use client";

import React, { useEffect, useState } from "react";
import { useAuth, defaultAppNameFor, DEFAULT_APP_NAME } from "@/components/AuthProvider";
import { hasLegacyData, importLegacyData } from "@/lib/legacy-import";
import { ACCENTS, MODES, THEME_STORAGE_KEY, normalizeTheme, type ThemePref } from "@/lib/theme";
import { CheckIcon } from "@/components/Icons";

export default function SettingsPage() {
  const { profile, user, configured, appName, saveProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [customName, setCustomName] = useState(profile?.appName || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fill the form once the profile loads (it arrives a beat after the page).
  const loadedKey = profile ? `${profile.displayName}|${profile.appName}` : "";
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setCustomName(profile.appName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedKey]);

  const [legacy, setLegacy] = useState(false);
  const [importState, setImportState] = useState<"idle" | "confirm" | "working" | "done" | "error">("idle");
  const [importMsg, setImportMsg] = useState("");
  useEffect(() => {
    if (!user) return;
    hasLegacyData().then(setLegacy);
  }, [user]);

  // Theme: start from what this device is showing, then follow the account.
  const [theme, setTheme] = useState<ThemePref>(() => {
    if (profile?.theme) return profile.theme;
    try {
      return normalizeTheme(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || "null"));
    } catch {
      return normalizeTheme(null);
    }
  });
  const themeKey = profile?.theme ? `${profile.theme.accent}|${profile.theme.mode}` : "";
  useEffect(() => {
    if (profile?.theme) setTheme(profile.theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeKey]);
  function pickTheme(patch: Partial<ThemePref>) {
    const next = { ...theme, ...patch };
    setTheme(next);
    saveProfile({ theme: next });
  }

  const placeholder = displayName.trim() ? defaultAppNameFor(displayName) : DEFAULT_APP_NAME;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProfile({ displayName: displayName.trim(), appName: customName.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function runImport() {
    if (!user) return;
    setImportState("working");
    try {
      const r = await importLegacyData(user.uid);
      setImportState("done");
      setImportMsg(`Imported ${r.classes} class${r.classes === 1 ? "" : "es"}, your schedules, planner and days off.`);
    } catch (err) {
      setImportState("error");
      setImportMsg((err as Error)?.message || "Import failed.");
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-head">
        <div>
          <span className="eyebrow">Settings</span>
          <h1>{appName}</h1>
          <div className="sub">Make the app yours.</div>
        </div>
      </div>

      <section className="section">
        <h2 className="section-title">Profile</h2>
        <form className="card settings-card" onSubmit={handleSave}>
          {profile?.username ? (
            <div className="field-row">
              <label>Username</label>
              <div className="settings-static">{profile.username}</div>
            </div>
          ) : null}
          <div className="field-row">
            <label htmlFor="set-name">Your name</label>
            <input
              id="set-name"
              type="text"
              value={displayName}
              maxLength={40}
              placeholder="Quinn"
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="field-row">
            <label htmlFor="set-app">App name</label>
            <input
              id="set-app"
              type="text"
              value={customName}
              maxLength={40}
              placeholder={placeholder}
              onChange={(e) => setCustomName(e.target.value)}
            />
            <div className="settings-hint">
              Shows in the sidebar and the browser tab. Leave blank to use “{placeholder}”.
            </div>
          </div>
          <div className="form-actions">
            {saved ? <span className="settings-saved">Saved</span> : null}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </section>

      <section className="section">
        <h2 className="section-title">Appearance</h2>
        <div className="card settings-card">
          <div className="field-row">
            <label>Mode</label>
            <div className="segmented" role="radiogroup" aria-label="Light or dark mode">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  role="radio"
                  aria-checked={theme.mode === m.key}
                  className={"segmented-opt" + (theme.mode === m.key ? " active" : "")}
                  onClick={() => pickTheme({ mode: m.key })}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field-row">
            <label>Color</label>
            <div className="accent-row" role="radiogroup" aria-label="Accent color">
              {ACCENTS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  role="radio"
                  aria-checked={theme.accent === a.key}
                  aria-label={a.label}
                  title={a.label}
                  className={"accent-swatch" + (theme.accent === a.key ? " selected" : "")}
                  style={{ background: a.swatch }}
                  onClick={() => pickTheme({ accent: a.key })}
                >
                  {theme.accent === a.key ? <CheckIcon /> : null}
                </button>
              ))}
            </div>
            <div className="settings-hint">Saved to your account, so it follows you to other devices.</div>
          </div>
        </div>
      </section>

      {legacy && importState !== "done" ? (
        <section className="section">
          <h2 className="section-title">Bring in your old data</h2>
          <div className="card settings-card">
            <p className="settings-hint" style={{ margin: 0 }}>
              There are classes, homework and schedules from before accounts existed. Copy them into this
              account? Anything with the same name here gets replaced.
            </p>
            <div className="form-actions">
              {importState === "confirm" ? (
                <>
                  <button type="button" className="btn btn-ghost" onClick={() => setImportState("idle")}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={runImport}>
                    Yes, import
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={importState === "working"}
                  onClick={() => setImportState("confirm")}
                >
                  {importState === "working" ? "Importing…" : "Import old data"}
                </button>
              )}
            </div>
            {importState === "error" ? <div className="login-error">{importMsg}</div> : null}
          </div>
        </section>
      ) : null}
      {importState === "done" ? (
        <section className="section">
          <div className="card settings-card">
            <div className="settings-saved">{importMsg}</div>
          </div>
        </section>
      ) : null}

      {configured ? (
        <section className="section">
          <h2 className="section-title">Account</h2>
          <div className="card settings-card">
            <div className="form-actions" style={{ justifyContent: "flex-start" }}>
              <button type="button" className="btn btn-ghost" onClick={() => signOut()}>
                Log out
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
