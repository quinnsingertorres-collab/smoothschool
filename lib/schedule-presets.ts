import { Period, PeriodType, ScheduleVersion } from "./types";
import { uid } from "./date";

function p(label: string, start: string, end: string, type: PeriodType = "class"): Period {
  return { id: uid(), label, start, end, type, classId: null };
}

// Seed data from the MHS Bell Schedule 2025-2026 flyer, First Lunch wave.
// "Warning" bells (instantaneous, 7:40) are intentionally left out — add one
// manually as an "Other" period if you want it to show up.
export function defaultScheduleVersions(): ScheduleVersion[] {
  return [
    {
      id: uid(),
      name: "Regular",
      periods: [
        p("Advisory", "07:45", "07:48", "other"),
        p("Period 1", "07:51", "08:42"),
        p("Period 2", "08:45", "09:36"),
        p("Period 3", "09:39", "10:30"),
        p("Period 4", "10:33", "11:24"),
        p("Lunch", "11:24", "11:54", "lunch"),
        p("Period 5", "11:54", "12:45"),
        p("Period 6", "12:48", "13:39"),
        p("Period 7", "13:42", "14:33"),
      ],
    },
    {
      id: uid(),
      name: "Early Release",
      periods: [
        p("Advisory", "07:45", "07:48", "other"),
        p("Period 1", "07:51", "08:24"),
        p("Period 2", "08:27", "09:00"),
        p("Period 3", "09:03", "09:36"),
        p("Period 4", "09:39", "10:12"),
        p("Period 5", "10:15", "10:48"),
        p("Period 6", "10:51", "11:24"),
        p("Period 7", "11:27", "12:00"),
      ],
    },
    {
      id: uid(),
      name: "Advisory Activity",
      periods: [
        p("Advisory", "07:45", "07:49", "other"),
        p("Period 1", "07:52", "08:36"),
        p("Period 2", "08:39", "09:23"),
        p("Period 3", "09:26", "10:10"),
        p("Advisory Activity", "10:13", "10:57", "other"),
        p("Period 4", "11:00", "11:44"),
        p("Lunch", "11:44", "12:15", "lunch"),
        p("Period 5", "12:15", "12:59"),
        p("Period 6", "13:02", "13:46"),
        p("Period 7", "13:49", "14:33"),
      ],
    },
    {
      id: uid(),
      name: "Extended Advisory",
      periods: [
        p("Advisory", "07:45", "08:15", "other"),
        p("Period 1", "08:18", "09:05"),
        p("Period 2", "09:08", "09:55"),
        p("Period 3", "09:58", "10:45"),
        p("Period 4", "10:48", "11:35"),
        p("Lunch", "11:35", "12:06", "lunch"),
        p("Period 5", "12:06", "12:53"),
        p("Period 6", "12:56", "13:43"),
        p("Period 7", "13:46", "14:33"),
      ],
    },
  ];
}
