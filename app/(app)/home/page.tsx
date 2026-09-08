"use client";

import React from "react";
import Link from "next/link";
import { useData } from "@/components/DataProvider";
import { useOpenAddClass } from "@/components/AddClassContext";
import { WeatherWidget } from "@/components/WeatherWidget";
import { PlusIcon, CalendarOffIcon } from "@/components/Icons";
import { fmtTime, dueBadge, todayISO, nowHM, todayKey, meetsOnDay } from "@/lib/date";
import { Period } from "@/lib/types";

function sortedPeriods(periods: Period[]) {
  return [...periods].sort((a, b) => (a.start || "").localeCompare(b.start || ""));
}
function findCurrentPeriod(periods: Period[]) {
  const t = nowHM();
  return periods.find((p) => p.start && p.end && t >= p.start && t < p.end) || null;
}

const USER_NAME = "Quinn";

function greeting(hour: number) {
  if (hour < 5) return "Up late, ";
  if (hour < 12) return "Good morning, ";
  if (hour < 17) return "Good afternoon, ";
  if (hour < 21) return "Good evening, ";
  return "Up late, ";
}

export default function HomePage() {
  const { classes, schedule, noSchoolMap, dbConfigured, dbReady, classById } = useData();
  const openAddClass = useOpenAddClass();

  const today = new Date();
  const dateStr = today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const iso = todayISO(today);
  const noSchoolReason = noSchoolMap[iso];
  const todayDayKey = todayKey();

  const ps = sortedPeriods(schedule);
  const cur = findCurrentPeriod(ps);

  const dueItems = classes
    .flatMap((c) => [
      ...(c.homework || [])
        .filter((h) => !h.done && h.dueDate)
        .map((h) => ({ kind: "Homework", classId: c.id, className: c.name, color: c.color, title: h.title, dueDate: h.dueDate })),
      ...(c.projects || [])
        .filter((p) => p.status !== "done" && p.dueDate)
        .map((p) => ({ kind: "Project", classId: c.id, className: c.name, color: c.color, title: p.title, dueDate: p.dueDate })),
    ])
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div>
      <div className="page-head today-head">
        <div>
          <span className="eyebrow">
            {greeting(today.getHours())}
            {USER_NAME}
          </span>
          <h1>{dateStr}</h1>
          <div className="sub">
            {dbConfigured && !dbReady
              ? "Loading…"
              : !dbConfigured
              ? "Firebase isn't configured yet — changes won't be saved. See the README."
              : noSchoolReason
              ? "No school today"
              : ps.length
              ? cur
                ? `Right now: ${cur.label}`
                : "No class in session right now"
              : "Add your schedule to see today at a glance"}
          </div>
        </div>
        <WeatherWidget />
      </div>

      {noSchoolReason ? (
        <div className="no-school-banner">
          <CalendarOffIcon />
          <div>
            <div className="title">No school today</div>
            <div className="reason">{noSchoolReason}</div>
          </div>
        </div>
      ) : ps.length ? (
        <div className="today-strip">
          {ps.map((p) => {
            const cls = p.classId ? classById(p.classId) : null;
            const skipped = cls ? !meetsOnDay(cls.days, todayDayKey) : false;
            return (
              <div
                key={p.id}
                className={"period-chip" + (cur && cur.id === p.id ? " current" : "") + (skipped ? " skipped" : "")}
              >
                <div className="time tabular">{fmtTime(p.start)}</div>
                <div className="pname">{p.label}</div>
                {cls ? (
                  <div className="pclass" style={{ color: skipped ? undefined : cls.color }}>
                    {skipped ? `${cls.name} — not today` : cls.name}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="dash-grid" style={{ marginTop: 22 }}>
        <div className="section">
          <div className="section-title">Due soon</div>
          <div className="card">
            {!dueItems.length ? (
              <div className="empty" style={{ border: "none" }}>
                <h3>Nothing due</h3>
                <p>Homework and projects with due dates will show up here.</p>
              </div>
            ) : (
              dueItems.slice(0, 8).map((item, i) => {
                const b = dueBadge(item.dueDate);
                return (
                  <div className="due-row" key={i}>
                    <span className="due-dot" style={{ background: item.color }} />
                    <div className="due-main">
                      <div className="due-title">{item.title}</div>
                      <div className="due-sub">
                        {item.kind} · {item.className}
                      </div>
                    </div>
                    <span className={"due-badge " + b.cls}>{b.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="section">
          <div className="section-title">Your classes</div>
          {!classes.length ? (
            <div className="empty">
              <h3>No classes yet</h3>
              <p>Add your first class to start tracking homework, projects and links.</p>
              <button className="btn btn-primary" onClick={openAddClass}>
                <PlusIcon /> Add a class
              </button>
            </div>
          ) : (
            <div className="class-tiles">
              {classes.map((c) => {
                const openHw = (c.homework || []).filter((h) => !h.done).length;
                const meetsToday = meetsOnDay(c.days, todayDayKey);
                return (
                  <Link href={`/${c.id}`} className={"class-tile" + (meetsToday ? "" : " not-today")} key={c.id}>
                    <div className="top">
                      <span className="dot" style={{ background: c.color }} />
                      <span className="name">{c.name || "Untitled class"}</span>
                      {!meetsToday ? <span className="not-today-badge">Not today</span> : null}
                    </div>
                    <div className="meta">
                      {c.teacher ? c.teacher + " · " : ""}
                      {c.room ? "Rm " + c.room : ""}
                    </div>
                    <div className="meta">
                      {openHw} open homework item{openHw === 1 ? "" : "s"}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
