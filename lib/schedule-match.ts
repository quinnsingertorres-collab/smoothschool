import { ClassData, Period } from "./types";

// Pulls every number out of a string, e.g. "6 & 7" -> [6, 7], "Period 3" -> [3].
export function parsePeriodNumbers(text: string): number[] {
  if (!text) return [];
  const found = text.match(/\d+/g);
  return found ? found.map((n) => parseInt(n, 10)) : [];
}

// For every unassigned "class" period, tries to match it to exactly one class
// that shares a period number (parsed from the class's own Period field, e.g.
// "6 & 7" matches both Period 6 and Period 7). Ambiguous or unmatched periods
// are left alone rather than guessed. Returns { periodId: classId }.
export function autoMatchClasses(periods: Period[], classes: ClassData[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const p of periods) {
    if (p.type !== "class" || p.classId) continue;
    const periodNums = parsePeriodNumbers(p.label);
    if (!periodNums.length) continue;
    const matches = classes.filter((c) => {
      const classNums = parsePeriodNumbers(c.period);
      return classNums.some((n) => periodNums.includes(n));
    });
    if (matches.length === 1) {
      result[p.id] = matches[0].id;
    }
  }
  return result;
}
