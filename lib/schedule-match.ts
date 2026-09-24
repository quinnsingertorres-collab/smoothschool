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

// Sorts classes into the order they happen during the day, for the sidebar
// and the Today tiles. For each class it finds a start time, trying in turn:
//   1. a period linked to the class in today's schedule,
//   2. the same in the default schedule, then any other schedule version,
//   3. a period whose number matches the class's Period field ("3", "6 & 7"),
//   4. the class's period number on its own.
// Classes with none of those go last, in the order they were added.
export function sortClassesByTime(
  classes: ClassData[],
  versions: { id: string; periods: Period[] }[],
  todaysVersionId: string,
  defaultVersionId: string
): ClassData[] {
  const ordered = [
    ...versions.filter((v) => v.id === todaysVersionId),
    ...versions.filter((v) => v.id === defaultVersionId && v.id !== todaysVersionId),
    ...versions.filter((v) => v.id !== todaysVersionId && v.id !== defaultVersionId),
  ];

  function key(c: ClassData): [number, number] {
    for (const v of ordered) {
      const starts = v.periods.filter((p) => p.classId === c.id && p.start).map((p) => p.start).sort();
      if (starts.length) return [0, minutes(starts[0])];
    }
    const nums = parsePeriodNumbers(c.period);
    if (nums.length) {
      const first = Math.min(...nums);
      for (const v of ordered) {
        const match = v.periods
          .filter((p) => p.type === "class" && p.start && parsePeriodNumbers(p.label).includes(first))
          .map((p) => p.start)
          .sort()[0];
        if (match) return [0, minutes(match)];
      }
      return [1, first];
    }
    return [2, c.order ?? 0];
  }

  return classes
    .map((c, i) => ({ c, k: key(c), i }))
    .sort((a, b) => a.k[0] - b.k[0] || a.k[1] - b.k[1] || (a.c.order ?? 0) - (b.c.order ?? 0) || a.i - b.i)
    .map((x) => x.c);
}

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}
