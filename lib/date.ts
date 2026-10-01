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

export function nowHM(d: Date = new Date()): string {
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

// True once the due date itself has fully ended (i.e. it's now a later
// calendar day) -- used to auto-clear "optional" homework at end of day on
// its due date, regardless of whether it was ever marked done.
export function pastEndOfDueDate(dueDate: string): boolean {
  if (!dueDate) return false;
  const n = daysUntil(dueDate);
  return n !== null && n < 0;
}

// Countdown label for a test/quiz/important date.
export function eventBadge(iso: string): { cls: "past" | "today" | "soon" | "later"; label: string } {
  const n = daysUntil(iso);
  if (n === null) return { cls: "later", label: "" };
  if (n < 0) return { cls: "past", label: fmtDate(iso) };
  if (n === 0) return { cls: "today", label: "Today" };
  if (n === 1) return { cls: "soon", label: "Tomorrow" };
  if (n <= 6) return { cls: n <= 3 ? "soon" : "later", label: `In ${n} days` };
  return { cls: "later", label: fmtDate(iso) };
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

// ---------- School-day status resets ----------
// Homework statuses ("done" check-offs and "No homework today" marks) reset
// at the start of the next day school is in session.
export const SCHOOL_DAY_START = "07:51";

export function addDaysISO(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

// Mon–Fri, minus anything on the Schedule page's "days off" list.
export function isSchoolDay(iso: string, noSchool: Record<string, string>): boolean {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return false;
  const wd = d.getDay();
  return wd !== 0 && wd !== 6 && !noSchool[iso];
}

export function nextSchoolDayAfter(iso: string, noSchool: Record<string, string>): string {
  let d = addDaysISO(iso, 1);
  // A year of days off in a row would be strange; the cap just guarantees
  // the loop ends.
  for (let i = 0; i < 370 && !isSchoolDay(d, noSchool); i++) d = addDaysISO(d, 1);
  return d;
}

function atTime(iso: string, hm: string): number {
  return new Date(`${iso}T${hm}:00`).getTime();
}

// When a status set on `dayISO` resets: 7:51 AM on the next school day.
export function statusResetTime(dayISO: string, noSchool: Record<string, string>): number {
  return atTime(nextSchoolDayAfter(dayISO, noSchool), SCHOOL_DAY_START);
}

// A checked-off assignment clears at 7:51 AM on the next school day after it
// was checked off -- but never before 7:51 AM on its own due date, so
// something finished early stays visible (as done) until it's handed in.
export function homeworkClearTime(
  h: { doneAt?: string; dueDate: string },
  noSchool: Record<string, string>
): number | null {
  if (!h.doneAt) return null;
  const doneDay = todayISO(new Date(h.doneAt));
  let t = statusResetTime(doneDay, noSchool);
  if (h.dueDate) t = Math.max(t, atTime(h.dueDate, SCHOOL_DAY_START));
  return t;
}

// Is a "No homework today" mark (set on `markedISO`) still in effect?
export function noHomeworkActive(markedISO: string, noSchool: Record<string, string>, now = Date.now()): boolean {
  if (!markedISO) return false;
  return now < statusResetTime(markedISO, noSchool);
}
