// Theme = an accent color + a light/dark/system mode.
//
// The actual color math lives in THEME_BOOT_SCRIPT, which runs inline in
// <head> before the page paints (so there's no flash of the default purple
// on load) and also installs window.__ssApplyTheme for the Settings page
// to call when the user picks something new. One copy of the logic, used
// both places.

export type ThemeMode = "system" | "light" | "dark";
export type AccentKey = "violet" | "indigo" | "blue" | "teal" | "green" | "orange" | "rose" | "slate";

export interface ThemePref {
  accent: AccentKey;
  mode: ThemeMode;
}

export const DEFAULT_THEME: ThemePref = { accent: "violet", mode: "system" };
export const THEME_STORAGE_KEY = "ss-theme";

// Swatch colors for the picker (the light-mode accent).
export const ACCENTS: { key: AccentKey; label: string; swatch: string }[] = [
  { key: "violet", label: "Violet", swatch: "#6d28d9" },
  { key: "indigo", label: "Indigo", swatch: "hsl(232 70% 52%)" },
  { key: "blue", label: "Blue", swatch: "hsl(210 80% 44%)" },
  { key: "teal", label: "Teal", swatch: "hsl(178 75% 30%)" },
  { key: "green", label: "Green", swatch: "hsl(148 60% 32%)" },
  { key: "orange", label: "Orange", swatch: "hsl(22 85% 44%)" },
  { key: "rose", label: "Rose", swatch: "hsl(340 72% 46%)" },
  { key: "slate", label: "Slate", swatch: "hsl(220 18% 38%)" },
];

export const MODES: { key: ThemeMode; label: string }[] = [
  { key: "system", label: "Auto" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
];

export function normalizeTheme(t: Partial<ThemePref> | null | undefined): ThemePref {
  const accent = ACCENTS.some((a) => a.key === t?.accent) ? (t!.accent as AccentKey) : DEFAULT_THEME.accent;
  const mode = MODES.some((m) => m.key === t?.mode) ? (t!.mode as ThemeMode) : DEFAULT_THEME.mode;
  return { accent, mode };
}

declare global {
  interface Window {
    __ssApplyTheme?: (pref: ThemePref) => void;
  }
}

export function applyTheme(pref: ThemePref) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(pref));
  } catch {
    /* private mode etc. -- fine, it just won't be remembered on this device */
  }
  window.__ssApplyTheme?.(pref);
}

export const THEME_BOOT_SCRIPT = `(function(){
  // [hue, saturation scale, light-mode accent lightness]
  var A = {
    indigo:[232,1,52], blue:[210,1.1,44], teal:[178,1,30], green:[148,0.85,32],
    orange:[22,1.2,44], rose:[340,1,46], slate:[220,0.25,38]
  };
  var VARS = ["--paper","--surface","--surface-2","--ink","--ink-soft","--ink-faint","--line","--line-strong",
    "--violet","--violet-deep","--violet-soft","--violet-soft-line","--shadow"];
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var current = { accent: "violet", mode: "system" };
  function hsl(h, s, l){ return "hsl(" + h + " " + Math.min(100, Math.round(s)) + "% " + l + "%)"; }
  function apply(pref){
    current = pref || current;
    var root = document.documentElement;
    if (current.mode === "light" || current.mode === "dark") root.setAttribute("data-theme", current.mode);
    else root.removeAttribute("data-theme");
    var dark = current.mode === "dark" || (current.mode !== "light" && mq && mq.matches);
    var a = A[current.accent];
    var meta = document.querySelector('meta[name="theme-color"]');
    VARS.forEach(function(v){ root.style.removeProperty(v); });
    if (!a) { if (meta) meta.setAttribute("content", dark ? "#150f20" : "#4C1D95"); return; }
    var h = a[0], k = a[1], L = a[2], p = {};
    if (!dark) {
      p["--paper"] = hsl(h, 40*k, 98); p["--surface-2"] = hsl(h, 50*k, 95);
      p["--ink"] = hsl(h, 33*k, 15); p["--ink-soft"] = hsl(h, 12*k, 44); p["--ink-faint"] = hsl(h, 14*k, 62);
      p["--line"] = hsl(h, 33*k, 90); p["--line-strong"] = hsl(h, 38*k, 84);
      p["--violet"] = hsl(h, 72*k, L); p["--violet-deep"] = hsl(h, 68*k, Math.max(20, L-16));
      p["--violet-soft"] = hsl(h, 76*k, 94); p["--violet-soft-line"] = hsl(h, 70*k, 87);
      p["--shadow"] = "0 1px 2px hsl(" + h + " 60% 25% / 0.06), 0 6px 20px -8px hsl(" + h + " 60% 25% / 0.18)";
    } else {
      p["--paper"] = hsl(h, 36*k, 9); p["--surface"] = hsl(h, 32*k, 13); p["--surface-2"] = hsl(h, 34*k, 16);
      p["--ink"] = hsl(h, 55*k, 95); p["--ink-soft"] = hsl(h, 28*k, 72); p["--ink-faint"] = hsl(h, 15*k, 52);
      p["--line"] = hsl(h, 30*k, 23); p["--line-strong"] = hsl(h, 27*k, 30);
      p["--violet"] = hsl(h, 85*k, 72); p["--violet-deep"] = hsl(h, 90*k, 85);
      p["--violet-soft"] = hsl(h, 36*k, 20); p["--violet-soft-line"] = hsl(h, 32*k, 33);
    }
    for (var key in p) root.style.setProperty(key, p[key]);
    if (meta) meta.setAttribute("content", dark ? p["--paper"] : p["--violet-deep"]);
  }
  window.__ssApplyTheme = apply;
  if (mq) {
    var onChange = function(){ if (current.mode === "system") apply(current); };
    if (mq.addEventListener) mq.addEventListener("change", onChange); else if (mq.addListener) mq.addListener(onChange);
  }
  try { var s = JSON.parse(localStorage.getItem("${"ss-theme"}") || "null"); if (s) apply(s); } catch (e) {}
})();`;
