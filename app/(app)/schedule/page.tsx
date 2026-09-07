"use client";

import React, { useState } from "react";
import { useData } from "@/components/DataProvider";
import { PlusIcon, PencilIcon, TrashIcon, CalendarOffIcon } from "@/components/Icons";
import { fmtTime, nowHM, todayISO, fmtDate } from "@/lib/date";
import { Period, PeriodType } from "@/lib/types";

function sortedPeriods(periods: Period[]) {
  return [...periods].sort((a, b) => (a.start || "").localeCompare(b.start || ""));
}
function findCurrentPeriod(periods: Period[]) {
  const t = nowHM();
  return periods.find((p) => p.start && p.end && t >= p.start && t < p.end) || null;
}

function PeriodForm({
  initial,
  classes,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: Partial<Period>;
  classes: { id: string; name: string }[];
  onSubmit: (data: Omit<Period, "id">) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <form
      className="inline-form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = e.currentTarget;
        const label = (f.elements.namedItem("label") as HTMLInputElement).value.trim();
        if (!label) return;
        onSubmit({
          label,
          start: (f.elements.namedItem("start") as HTMLInputElement).value,
          end: (f.elements.namedItem("end") as HTMLInputElement).value,
          type: (f.elements.namedItem("type") as HTMLSelectElement).value as PeriodType,
          classId: (f.elements.namedItem("classId") as HTMLSelectElement).value || null,
        });
      }}
    >
      <div className="form-grid">
        <div className="field-row">
          <label>Label</label>
          <input type="text" name="label" required defaultValue={initial?.label} placeholder="Period 1" />
        </div>
        <div className="field-row">
          <label>Start</label>
          <input type="time" name="start" required defaultValue={initial?.start} />
        </div>
        <div className="field-row">
          <label>End</label>
          <input type="time" name="end" required defaultValue={initial?.end} />
        </div>
        <div className="field-row">
          <label>Type</label>
          <select name="type" defaultValue={initial?.type || "class"}>
            <option value="class">Class</option>
            <option value="lunch">Lunch</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="field-row" style={{ gridColumn: "1/-1" }}>
          <label>Class (optional)</label>
          <select name="classId" defaultValue={initial?.classId || ""}>
            <option value="">No class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-sm">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function SchedulePage() {
  const { schedule, classes, classById, addPeriod, updatePeriod, deletePeriod, noSchoolDays, addNoSchoolDay, deleteNoSchoolDay } =
    useData();
  const [addingPeriod, setAddingPeriod] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingDayOff, setAddingDayOff] = useState(false);

  const ps = sortedPeriods(schedule);
  const cur = findCurrentPeriod(ps);
  const upcomingDayOff = new Date();
  upcomingDayOff.setDate(upcomingDayOff.getDate() - 1);
  const relevantDaysOff = noSchoolDays.filter((d) => d.date >= todayISO(upcomingDayOff));

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">Schedule</span>
          <h1>Periods &amp; times</h1>
          <div className="sub">Set up your daily period times, lunch block, and which class falls in each period.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAddingPeriod((v) => !v)}>
          <PlusIcon /> Add period
        </button>
      </div>

      {addingPeriod ? (
        <PeriodForm
          classes={classes}
          submitLabel="Add"
          onCancel={() => setAddingPeriod(false)}
          onSubmit={(data) => {
            addPeriod(data);
            setAddingPeriod(false);
          }}
        />
      ) : null}

      <div className="card" style={{ overflowX: "auto" }}>
        {!ps.length ? (
          <div className="empty" style={{ border: "none" }}>
            <h3>No periods yet</h3>
            <p>Add your first period, passing time, or lunch block above.</p>
          </div>
        ) : (
          <table className="sched">
            <thead>
              <tr>
                <th>Period</th>
                <th>Time</th>
                <th>Type</th>
                <th>Class</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ps.map((p) => {
                const isEditing = editingId === p.id;
                const isCur = cur && cur.id === p.id;
                const rowClass = (p.type === "lunch" ? "lunch-row " : "") + (isCur ? "current-row" : "");
                if (isEditing) {
                  return (
                    <tr className={rowClass} key={p.id}>
                      <td colSpan={5} style={{ padding: "10px 6px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "flex-end",
                            flexWrap: "wrap",
                          }}
                        >
                          <PeriodForm
                            initial={p}
                            classes={classes}
                            submitLabel="Save"
                            onCancel={() => setEditingId(null)}
                            onSubmit={(data) => {
                              updatePeriod(p.id, data);
                              setEditingId(null);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                }
                const cls = p.classId ? classById(p.classId) : null;
                return (
                  <tr className={rowClass} key={p.id}>
                    <td>{p.label}</td>
                    <td className="time-cell tabular">
                      {fmtTime(p.start)} – {fmtTime(p.end)}
                    </td>
                    <td>
                      <span className={"type-tag " + (p.type || "class")}>
                        {p.type === "lunch" ? "Lunch" : p.type === "other" ? "Other" : "Class"}
                      </span>
                    </td>
                    <td>
                      {cls ? (
                        <>
                          <span
                            style={{
                              display: "inline-block",
                              background: cls.color,
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              marginRight: 6,
                            }}
                          />
                          {cls.name}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn-ghost btn-sm" onClick={() => setEditingId(p.id)}>
                        <PencilIcon />
                      </button>{" "}
                      <button className="btn-danger-ghost" onClick={() => deletePeriod(p.id)}>
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="section" style={{ marginTop: 30 }}>
        <div className="section-title">
          Days off
          <button className="btn btn-sm" onClick={() => setAddingDayOff((v) => !v)}>
            <PlusIcon /> Add
          </button>
        </div>
        <div className="sub" style={{ marginBottom: 12 }}>
          Mark holidays, snow days, or breaks — the dashboard shows a no-school banner instead of your period schedule that day.
        </div>

        {addingDayOff ? (
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget;
              const date = (f.elements.namedItem("date") as HTMLInputElement).value;
              const reason = (f.elements.namedItem("reason") as HTMLInputElement).value.trim();
              if (!date) return;
              addNoSchoolDay(date, reason || "No school");
              setAddingDayOff(false);
            }}
          >
            <div className="form-grid">
              <div className="field-row">
                <label>Date</label>
                <input type="date" name="date" required />
              </div>
              <div className="field-row" style={{ gridColumn: "1/-1" }}>
                <label>Reason (optional)</label>
                <input type="text" name="reason" placeholder="Teacher in-service day, snow day, winter break…" />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddingDayOff(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Mark as no school
              </button>
            </div>
          </form>
        ) : null}

        <div className="card">
          {!relevantDaysOff.length ? (
            <div className="empty" style={{ border: "none" }}>
              <h3>No days off marked</h3>
              <p>Add a date above to mark it as a no-school day.</p>
            </div>
          ) : (
            relevantDaysOff.map((d) => (
              <div className="dayoff-row" key={d.date}>
                <CalendarOffIcon />
                <span className="dayoff-date tabular">{fmtDate(d.date)}</span>
                <span className="dayoff-reason">{d.reason}</span>
                <button className="btn-danger-ghost" onClick={() => deleteNoSchoolDay(d.date)}>
                  <TrashIcon />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
