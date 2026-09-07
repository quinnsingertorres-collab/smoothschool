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
} from "@/lib/types";
import { uid } from "@/lib/date";
import { slugify, uniqueSlug } from "@/lib/slug";

function emptyPlanner(): PlannerDoc {
  const p = {} as PlannerDoc;
  DAY_KEYS.forEach((k) => (p[k] = []));
  return p;
}

interface DataContextValue {
  dbReady: boolean; // Firebase configured AND the first read has come back
  dbConfigured: boolean; // Firebase config values are present at all
  classes: ClassData[];
  schedule: Period[];
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

  addPeriod: (p: Omit<Period, "id">) => void;
  updatePeriod: (id: string, patch: Partial<Period>) => void;
  deletePeriod: (id: string) => void;

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
  const [schedule, setSchedule] = useState<Period[]>([]);
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
        const data = snap.exists() ? (snap.data() as { periods?: Period[] }) : {};
        setSchedule(data.periods || []);
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

  function saveSchedule(periods: Period[]) {
    setSchedule(periods);
    if (db) setDoc(doc(db, "schedule", "main"), { periods });
  }
  function addPeriod(p: Omit<Period, "id">) {
    saveSchedule([...schedule, { ...p, id: uid() }]);
  }
  function updatePeriod(id: string, patch: Partial<Period>) {
    saveSchedule(schedule.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function deletePeriod(id: string) {
    saveSchedule(schedule.filter((p) => p.id !== id));
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

  const value: DataContextValue = {
    dbReady: firebaseReady && gotFirstSnapshot,
    dbConfigured: firebaseReady,
    classes,
    schedule,
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
    addPlannerBlock,
    deletePlannerBlock,
    addNoSchoolDay,
    deleteNoSchoolDay,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
