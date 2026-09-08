export interface HomeworkItem {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD, or ""
  notes: string;
  done: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  dueDate: string;
  status: "not-started" | "in-progress" | "done";
  notes: string;
}

export interface ClassData {
  id: string; // also the URL slug
  name: string;
  period: string;
  teacher: string;
  room: string;
  contact: string;
  classroomLink: string;
  driveLink: string;
  color: string;
  order: number;
  homework: HomeworkItem[];
  projects: ProjectItem[];
}

export type PeriodType = "class" | "lunch" | "other";

export interface Period {
  id: string;
  label: string;
  start: string; // HH:MM 24h
  end: string;
  type: PeriodType;
  classId: string | null;
}

export interface ScheduleVersion {
  id: string;
  name: string;
  periods: Period[];
}

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export interface PlannerBlock {
  id: string;
  title: string;
  start: string;
  end: string;
  notes: string;
}

export type PlannerDoc = Record<DayKey, PlannerBlock[]>;

export interface NoSchoolDay {
  date: string; // YYYY-MM-DD
  reason: string;
}

export const CLASS_COLORS = [
  "#6D28D9",
  "#9333EA",
  "#C026D3",
  "#DB2777",
  "#4F46E5",
  "#2563EB",
  "#A21CAF",
  "#7C3AED",
];
