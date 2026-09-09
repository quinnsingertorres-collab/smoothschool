"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase";
import {
  ClassData,
  DAY_KEYS,
  DayKey,
  HomeworkItem,
  NoSchoolDay,
  Period,
  PlannerBlock,
  PlannerDoc,
  ProjectItem,
  ScheduleVersion,
} from "@/lib/types";
import { uid, todayKey } from "@/lib/date";
import { slugify, uniqueSlug } from "@/lib/slug";
import { defaultScheduleVersions } from "@/lib/schedule-presets";
import { autoMatchClasses } from "@/lib/schedule-match";

function emptyPlanner(): PlannerDoc {
  const p = {} as PlannerDoc;
  DAY_KEYS.forEach((k) => (p[k] = []));
  return p;
}

interface DataContextValue {
  dbReady: boolean; // Firebase configured AND the first read has come back
  dbConfigured: boolean; // Firebase config values are present at all
  classes: ClassData[];
  schedule: Period[]; // periods of whichever version is actually showing today
  scheduleVersions: ScheduleVersion[];
  activeScheduleId: string; // the manually-set default/fallback version
  todaysScheduleId: string; // the version actually in effect today (a day-matched version wins over the default)
  planner: PlannerDoc;
  noSchoolDays: NoSchoolDay[];
  noSchoolMap: Record<string, string>;

  classById: (id: string) => ClassData | undefined;

  addClass: (input: {
    name: string;
    period: string;
    teacher: string;
    room: string;
    color: string;
    days?: DayKey[];
  }) => Promise<string>;
  updateClassInfo: (id: string, patch: Partial<ClassData>) => void;
  deleteClass: (id: string) => void;

  addHomework: (classId: string, item: Omit<HomeworkItem, "id" | "done">) => void;
  toggleHomework: (classId: string, hwId: string) => void;
  deleteHomework: (classId: string, hwId: string) => void;

  addProject: (classId: string, item: Omit<ProjectItem, "id">) => void;
  setProjectStatus: (classId: string, projId: string, status: ProjectItem["status"]) => void;
  deleteProject: (classId: string, projId: string) => void;

  addPeriod: (versionId: string, p: Omit<Period, "id">) => void;
  updatePeriod: (versionId: string, id: string, patch: Partial<Period>) => void;
  deletePeriod: (versionId: string, id: string) => void;

  addScheduleVersion: (name: string, copyFromId?: string) => string;
  renameScheduleVersion: (id: string, name: string) => void;
  deleteScheduleVersion: (id: string) => void;
  setActiveSchedule: (id: string) => void;
  setScheduleActiveDays: (id: string, days: DayKey[]) => void;
  autoFillClasses: () => number;

  addPlannerBlock: (day: DayKey, block: Omit<PlannerBlock, "id">) => void;
  deletePlannerBlock: (day: DayKey, blockId: string) => void;

  addNoSchoolDay: (date: string, reason: string) => void;
  deleteNoSchoolDay: (date: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [scheduleVersions, setScheduleVersions] = useState<ScheduleVersion[]>(() => defaultScheduleVersions());
  const [activeScheduleId, setActiveScheduleIdRaw] = useState<string>(() => scheduleVersions[0]?.id || "");
  const [planner, setPlanner] = useState<PlannerDoc>(emptyPlanner());
  const [noSchoolDays, setNoSchoolDays] = useState<NoSchoolDay[]>([]);
  const [gotFirstSnapshot, setGotFirstSnapshot] = useState(false);

  useEffect(() => {
    if (!db) return;
    const unsubs = [
      onSnapshot(query(collection(db, "classes"), orderBy("order", "asc")), (snap) => {
        setClasses(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClassData, "id">) })));
        setGotFirstSnapshot(true);
      }),
      onSnapshot(doc(db, "schedule", "main"), (snap) => {
        const data = snap.exists()
          ? (snap.data() as { versions?: ScheduleVersion[]; activeVersionId?: string; periods?: Period[] })
          : {};
        if (data.versions && data.versions.length) {
          // Backfill any preset schedule versions that don't exist yet by name
          // (e.g. an account that already had a "Regular" schedule before the
          // Early Release / Advisory Activity / Extended Advisory presets shipped),
          // and refill an empty "Regular" version's periods from the preset too.
          const presets = defaultScheduleVersions();
          const existingNames = new Set(data.versions.map((v) => v.name));
          const missingPresets = presets.filter((v) => v.name !== "Regular" && !existingNames.has(v.name));
          let changed = missingPresets.length > 0;
          let versions = data.versions.map((v) => {
            if (v.name === "Regular" && v.periods.length === 0) {
              changed = true;
              const regularPreset = presets.find((p) => p.name === "Regular");
              return regularPreset ? { ...v, periods: regularPreset.periods } : v;
            }
            return v;
          });
          if (missingPresets.length) versions = [...versions, ...missingPresets];
          const activeId =
            data.activeVersionId && versions.some((v) => v.id === data.activeVersionId)
              ? data.activeVersionId
              : versions[0].id;
          setScheduleVersions(versions);
          setActiveScheduleIdRaw(activeId);
          if (changed && db) {
            setDoc(doc(db, "schedule", "main"), { versions, activeVersionId: activeId });
          }
        } else if (data.periods && data.periods.length) {
          // Legacy shape from before multiple schedule versions existed — migrate in place.
          const legacyId = uid();
          const migrated: ScheduleVersion[] = [{ id: legacyId, name: "Regular", periods: data.periods }];
          setScheduleVersions(migrated);
          setActiveScheduleIdRaw(legacyId);
          if (db) setDoc(doc(db, "schedule", "main"), { versions: migrated, activeVersionId: legacyId });
        } else {
          const seeded = defaultScheduleVersions();
          setScheduleVersions(seeded);
          setActiveScheduleIdRaw(seeded[0].id);
          if (db) setDoc(doc(db, "schedule", "main"), { versions: seeded, activeVersionId: seeded[0].id });
        }
      }),
      onSnapshot(doc(db, "planner", "week"), (snap) => {
        const data = snap.exists() ? (snap.data() as Partial<PlannerDoc>) : {};
        setPlanner({ ...emptyPlanner(), ...data });
      }),
      onSnapshot(collection(db, "noSchoolDays"), (snap) => {
        setNoSchoolDays(
          snap.docs
            .map((d) => ({ date: d.id, reason: (d.data().reason as string) || "" }))
            .sort((a, b) => a.date.localeCompare(b.date))
        );
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const classById = (id: string) => classes.find((c) => c.id === id);

  function saveClass(c: ClassData) {
    if (!db) {
      setClasses((prev) => prev.map((x) => (x.id === c.id ? c : x)));
      return;
    }
    const { id, ...data } = c;
    setDoc(doc(db, "classes", id), data);
  }

  async function addClass(input: {
    name: string;
    period: string;
    teacher: string;
    room: string;
    color: string;
    days?: DayKey[];
  }): Promise<string> {
    const existingSlugs = new Set(classes.map((c) => c.id));
    const slug = uniqueSlug(slugify(input.name), existingSlugs);
    const newClass: ClassData = {
      id: slug,
      name: input.name,
      period: input.period,
      teacher: input.teacher,
      room: input.room,
      contact: "",
      classroomLink: "",
      driveLink: "",
      color: input.color,
      order: classes.length,
      homework: [],
      projects: [],
      days: input.days && input.days.length ? input.days : [],
    };
    if (!db) {
      setClasses((prev) => [...prev, newClass]);
      return slug;
    }
    const { id, ...data } = newClass;
    await setDoc(doc(db, "classes", id), data);
    return slug;
  }

  function updateClassInfo(id: string, patch: Partial<ClassData>) {
    const c = classById(id);
    if (!c) return;
    saveClass({ ...c, ...patch });
  }

  function deleteClass(id: string) {
    if (!db) {
      setClasses((prev) => prev.filter((c) => c.id !== id));
      return;
    }
    deleteDoc(doc(db, "classes", id));
  }

  function addHomework(classId: string, item: Omit<HomeworkItem, "id" | "done">) {
    const c = classById(classId);
    if (!c) return;
    const homework = [...(c.homework || []), { ...item, id: uid(), done: false }];
    saveClass({ ...c, homework });
  }
  function toggleHomework(classId: string, hwId: string) {
    const c = classById(classId);
    if (!c) return;
    const homework = (c.homework || []).map((h) => (h.id === hwId ? { ...h, done: !h.done } : h));
    saveClass({ ...c, homework });
  }
  function deleteHomework(classId: string, hwId: string) {
    const c = classById(classId);
    if (!c) return;
    const homework = (c.homework || []).filter((h) => h.id !== hwId);
    saveClass({ ...c, homework });
  }

  function addProject(classId: string, item: Omit<ProjectItem, "id">) {
    const c = classById(classId);
    if (!c) return;
    const projects = [...(c.projects || []), { ...item, id: uid() }];
    saveClass({ ...c, projects });
  }
  function setProjectStatus(classId: string, projId: string, status: ProjectItem["status"]) {
    const c = classById(classId);
    if (!c) return;
    const projects = (c.projects || []).map((p) => (p.id === projId ? { ...p, status } : p));
    saveClass({ ...c, projects });
  }
  function deleteProject(classId: string, projId: string) {
    const c = classById(classId);
    if (!c) return;
    const projects = (c.projects || []).filter((p) => p.id !== projId);
    saveClass({ ...c, projects });
  }

  function saveScheduleState(versions: ScheduleVersion[], activeId: string) {
    setScheduleVersions(versions);
    setActiveScheduleIdRaw(activeId);
    if (db) setDoc(doc(db, "schedule", "main"), { versions, activeVersionId: activeId });
  }

  function addPeriod(versionId: string, p: Omit<Period, "id">) {
    const versions = scheduleVersions.map((v) =>
      v.id === versionId ? { ...v, periods: [...v.periods, { ...p, id: uid() }] } : v
    );
    saveScheduleState(versions, activeScheduleId);
  }
  function updatePeriod(versionId: string, id: string, patch: Partial<Period>) {
    const versions = scheduleVersions.map((v) =>
      v.id === versionId ? { ...v, periods: v.periods.map((p) => (p.id === id ? { ...p, ...patch } : p)) } : v
    );
    saveScheduleState(versions, activeScheduleId);
  }
  function deletePeriod(versionId: string, id: string) {
    const versions = scheduleVersions.map((v) =>
      v.id === versionId ? { ...v, periods: v.periods.filter((p) => p.id !== id) } : v
    );
    saveScheduleState(versions, activeScheduleId);
  }

  function addScheduleVersion(name: string, copyFromId?: string): string {
    const source = copyFromId ? scheduleVersions.find((v) => v.id === copyFromId) : undefined;
    const newVersion: ScheduleVersion = {
      id: uid(),
      name: name.trim() || "New schedule",
      periods: source ? source.periods.map((p) => ({ ...p, id: uid() })) : [],
    };
    saveScheduleState([...scheduleVersions, newVersion], activeScheduleId);
    return newVersion.id;
  }
  function renameScheduleVersion(id: string, name: string) {
    if (!name.trim()) return;
    saveScheduleState(
      scheduleVersions.map((v) => (v.id === id ? { ...v, name: name.trim() } : v)),
      activeScheduleId
    );
  }
  function deleteScheduleVersion(id: string) {
    if (scheduleVersions.length <= 1) return;
    const remaining = scheduleVersions.filter((v) => v.id !== id);
    const nextActive = activeScheduleId === id ? remaining[0].id : activeScheduleId;
    saveScheduleState(remaining, nextActive);
  }
  function setActiveSchedule(id: string) {
    if (!scheduleVersions.some((v) => v.id === id)) return;
    saveScheduleState(scheduleVersions, id);
  }

  function setScheduleActiveDays(id: string, days: DayKey[]) {
    saveScheduleState(
      scheduleVersions.map((v) => (v.id === id ? { ...v, activeDays: days } : v)),
      activeScheduleId
    );
  }

  function autoFillClasses(): number {
    let filledCount = 0;
    const versions = scheduleVersions.map((v) => {
      const matches = autoMatchClasses(v.periods, classes);
      const matchedIds = Object.keys(matches);
      if (!matchedIds.length) return v;
      filledCount += matchedIds.length;
      return {
        ...v,
        periods: v.periods.map((p) => (matches[p.id] ? { ...p, classId: matches[p.id] } : p)),
      };
    });
    if (filledCount > 0) saveScheduleState(versions, activeScheduleId);
    return filledCount;
  }

  function savePlanner(next: PlannerDoc) {
    setPlanner(next);
    if (db) setDoc(doc(db, "planner", "week"), next);
  }
  function addPlannerBlock(day: DayKey, block: Omit<PlannerBlock, "id">) {
    const next = { ...planner, [day]: [...(planner[day] || []), { ...block, id: uid() }] };
    savePlanner(next);
  }
  function deletePlannerBlock(day: DayKey, blockId: string) {
    const next = { ...planner, [day]: (planner[day] || []).filter((b) => b.id !== blockId) };
    savePlanner(next);
  }

  function addNoSchoolDay(date: string, reason: string) {
    if (!date) return;
    if (!db) {
      setNoSchoolDays((prev) =>
        [...prev.filter((d) => d.date !== date), { date, reason }].sort((a, b) =>
          a.date.localeCompare(b.date)
        )
      );
      return;
    }
    setDoc(doc(db, "noSchoolDays", date), { reason });
  }
  function deleteNoSchoolDay(date: string) {
    if (!db) {
      setNoSchoolDays((prev) => prev.filter((d) => d.date !== date));
      return;
    }
    deleteDoc(doc(db, "noSchoolDays", date));
  }

  const noSchoolMap = useMemo(() => {
    const m: Record<string, string> = {};
    noSchoolDays.forEach((d) => (m[d.date] = d.reason));
    return m;
  }, [noSchoolDays]);

  // A version with today's weekday in its activeDays takes over automatically
  // (a recurring pattern, e.g. "Mondays"); otherwise fall back to whichever
  // version is set as the default.
  const todaysVersion = useMemo(() => {
    const dayKey = todayKey();
    const autoMatch = scheduleVersions.find((v) => v.activeDays && v.activeDays.length && v.activeDays.includes(dayKey));
    return autoMatch || scheduleVersions.find((v) => v.id === activeScheduleId) || scheduleVersions[0];
  }, [scheduleVersions, activeScheduleId]);

  const schedule = todaysVersion ? todaysVersion.periods : [];
  const todaysScheduleId = todaysVersion ? todaysVersion.id : "";

  const value: DataContextValue = {
    dbReady: firebaseReady && gotFirstSnapshot,
    dbConfigured: firebaseReady,
    classes,
    schedule,
    scheduleVersions,
    activeScheduleId,
    todaysScheduleId,
    planner,
    noSchoolDays,
    noSchoolMap,
    classById,
    addClass,
    updateClassInfo,
    deleteClass,
    addHomework,
    toggleHomework,
    deleteHomework,
    addProject,
    setProjectStatus,
    deleteProject,
    addPeriod,
    updatePeriod,
    deletePeriod,
    addScheduleVersion,
    renameScheduleVersion,
    deleteScheduleVersion,
    setActiveSchedule,
    setScheduleActiveDays,
    autoFillClasses,
    addPlannerBlock,
    deletePlannerBlock,
    addNoSchoolDay,
    deleteNoSchoolDay,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
