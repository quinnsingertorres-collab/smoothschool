"use client";

import React, { useState } from "react";
import { useData } from "@/components/DataProvider";
import { PlusIcon, XIcon } from "@/components/Icons";
import { fmtTime, todayKey } from "@/lib/date";
import { DAY_KEYS, DayKey } from "@/lib/types";

const DAY_LABELS: Record<DayKey, { short: string }> = {
  mon: { short: "Mon" },
  tue: { short: "Tue" },
  wed: { short: "Wed" },
  thu: { short: "Thu" },
  fri: { short: "Fri" },
  sat: { short: "Sat" },
  sun: { short: "Sun" },
};

export default function PlannerPage() {
  const { planner, addPlannerBlock, deletePlannerBlock } = useData();
  const [openDay, setOpenDay] = useState<DayKey | null>(null);
  const tk = todayKey();

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">Planner</span>
          <h1>After school</h1>
          <div className="sub">Block out homework time, practice, clubs and downtime for each day of the week.</div>
        </div>
      </div>

      <div className="planner-grid">
        {DAY_KEYS.map((day) => {
          const blocks = [...(planner[day] || [])].sort((a, b) => (a.start || "").localeCompare(b.start || ""));
          const isOpen = openDay === day;
          return (
            <div className={"planner-col" + (day === tk ? " is-today" : "")} key={day}>
              <div className="pc-head">
                <span>{DAY_LABELS[day].short}</span>
              </div>
              <div className="pc-body">
                {isOpen ? (
                  <form
                    style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 6 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = e.currentTarget;
                      const title = (f.elements.namedItem("title") as HTMLInputElement).value.trim();
                      if (!title) return;
                      addPlannerBlock(day, {
                        title,
                        start: (f.elements.namedItem("start") as HTMLInputElement).value,
                        end: (f.elements.namedItem("end") as HTMLInputElement).value,
                        notes: (f.elements.namedItem("notes") as HTMLInputElement).value.trim(),
                      });
                      setOpenDay(null);
                    }}
                  >
                    <input type="text" name="title" required placeholder="Activity" style={{ fontSize: 12.5, padding: "6px 8px" }} />
                    <div style={{ display: "flex", gap: 5 }}>
                      <input type="time" name="start" style={{ fontSize: 11.5, padding: "5px 6px" }} />
                      <input type="time" name="end" style={{ fontSize: 11.5, padding: "5px 6px" }} />
                    </div>
                    <input type="text" name="notes" placeholder="Notes (optional)" style={{ fontSize: 11.5, padding: "5px 8px" }} />
                    <div style={{ display: "flex", gap: 5 }}>
                      <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setOpenDay(null)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                        Add
                      </button>
                    </div>
                  </form>
                ) : null}
                {!blocks.length && !isOpen ? (
                  <div style={{ color: "var(--ink-faint)", fontSize: 11.5, padding: "6px 2px" }}>Nothing planned</div>
                ) : null}
                {blocks.map((b) => (
                  <div className="block" key={b.id}>
                    <button className="b-del" onClick={() => deletePlannerBlock(day, b.id)} aria-label="Delete">
                      <XIcon />
                    </button>
                    <div className="b-time tabular">
                      {fmtTime(b.start)}
                      {b.end ? ` – ${fmtTime(b.end)}` : ""}
                    </div>
                    <div className="b-title">{b.title}</div>
                    {b.notes ? <div className="b-notes">{b.notes}</div> : null}
                  </div>
                ))}
              </div>
              {!isOpen ? (
                <button className="pc-add" onClick={() => setOpenDay(day)}>
                  <PlusIcon /> Add
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
