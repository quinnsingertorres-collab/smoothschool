export function uid(): string {
  return "id_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const JS_DAY_TO_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export function todayKey(): (typeof JS_DAY_TO_KEY)[number] {
  return JS_DAY_TO_KEY[new Date().getDay()];
}

export function meetsOnDay(days: import("./types").DayKey[] | undefined, dayKey: import("./types").DayKey): boolean {
  return !days || !days.length || days.includes(dayKey);
}

export function nowHM(): string {
  const d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

export function fmtTime(hm: string): string {
  if (!hm) return "";
  const [hStr, m] = hm.split(":");
  const h = parseInt(hStr, 10);
  const ap = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${m} ${ap}`;
}

export function fmtDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function dueBadge(iso: string): { cls: "overdue" | "soon" | "later"; label: string } {
  const n = daysUntil(iso);
  if (n === null) return { cls: "later", label: fmtDate(iso) };
  if (n < 0) return { cls: "overdue", label: n === -1 ? "1 day overdue" : `${-n} days overdue` };
  if (n === 0) return { cls: "soon", label: "Due today" };
  if (n === 1) return { cls: "soon", label: "Due tomorrow" };
  if (n <= 3) return { cls: "soon", label: `Due in ${n} days` };
  return { cls: "later", label: fmtDate(iso) };
}
