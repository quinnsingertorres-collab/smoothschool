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
import { uid } from "@/lib/date";
import { slugify, uniqueSlug } from "@/lib/slug";
import { defaultScheduleVersions } from "@/lib/schedule-presets";

function emptyPlanner(): PlannerDoc {
  const p = {} as PlannerDoc;
  DAY_KEYS.forEach((k) => (p[k] = []));
  return p;
}

interface DataContextValue {
  dbReady: boolean; // Firebase configured AND the first read has come back
  dbConfigured: boolean; // Firebase config values are present at all
  classes: ClassData[];
  schedule: Period[]; // periods of the active (default) schedule version
  scheduleVersions: ScheduleVersion[];
  activeScheduleId: string;
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
          setScheduleVersions(data.versions);
          setActiveScheduleIdRaw(
            data.activeVersionId && data.versions.some((v) => v.id === data.activeVersionId)
              ? data.activeVersionId
              : data.versions[0].id
          );
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

  const schedule = useMemo(() => {
    const active = scheduleVersions.find((v) => v.id === activeScheduleId) || scheduleVersions[0];
    return active ? active.periods : [];
  }, [scheduleVersions, activeScheduleId]);

  const value: DataContextValue = {
    dbReady: firebaseReady && gotFirstSnapshot,
    dbConfigured: firebaseReady,
    classes,
    schedule,
    scheduleVersions,
    activeScheduleId,
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
    addPlannerBlock,
    deletePlannerBlock,
    addNoSchoolDay,
    deleteNoSchoolDay,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
