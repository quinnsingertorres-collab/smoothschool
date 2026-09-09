"use client";

import React, { useState } from "react";
import { useData } from "@/components/DataProvider";
import { PlusIcon, XIcon, PencilIcon } from "@/components/Icons";
import { fmtTime, todayKey } from "@/lib/date";
import { DAY_KEYS, DayKey, PlannerBlock } from "@/lib/types";

function BlockForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Pick<PlannerBlock, "title" | "start" | "end" | "notes">;
  onSubmit: (v: { title: string; start: string; end: string; notes: string }) => void;
  onCancel: () => void;
}) {
  return (
    <form
      style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 6 }}
      onSubmit={(e) => {
        e.preventDefault();
        const f = e.currentTarget;
        const title = (f.elements.namedItem("title") as HTMLInputElement).value.trim();
        if (!title) return;
        onSubmit({
          title,
          start: (f.elements.namedItem("start") as HTMLInputElement).value,
          end: (f.elements.namedItem("end") as HTMLInputElement).value,
          notes: (f.elements.namedItem("notes") as HTMLInputElement).value.trim(),
        });
      }}
    >
      <input
        type="text"
        name="title"
        required
        defaultValue={initial?.title}
        placeholder="Activity"
        style={{ fontSize: 12.5, padding: "6px 8px" }}
      />
      <div style={{ display: "flex", gap: 5 }}>
        <input type="time" name="start" defaultValue={initial?.start} style={{ fontSize: 11.5, padding: "5px 6px" }} />
        <input type="time" name="end" defaultValue={initial?.end} style={{ fontSize: 11.5, padding: "5px 6px" }} />
      </div>
      <input
        type="text"
        name="notes"
        defaultValue={initial?.notes}
        placeholder="Notes (optional)"
        style={{ fontSize: 11.5, padding: "5px 8px" }}
      />
      <div style={{ display: "flex", gap: 5 }}>
        <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>
          {initial ? "Save" : "Add"}
        </button>
      </div>
    </form>
  );
}

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
  const { planner, addPlannerBlock, updatePlannerBlock, deletePlannerBlock } = useData();
  const [openDay, setOpenDay] = useState<DayKey | null>(null);
  const [editing, setEditing] = useState<{ day: DayKey; id: string } | null>(null);
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
                  <BlockForm
                    onSubmit={(v) => {
                      addPlannerBlock(day, v);
                      setOpenDay(null);
                    }}
                    onCancel={() => setOpenDay(null)}
                  />
                ) : null}
                {!blocks.length && !isOpen ? (
                  <div style={{ color: "var(--ink-faint)", fontSize: 11.5, padding: "6px 2px" }}>Nothing planned</div>
                ) : null}
                {blocks.map((b) =>
                  editing && editing.day === day && editing.id === b.id ? (
                    <BlockForm
                      key={b.id}
                      initial={b}
                      onSubmit={(v) => {
                        updatePlannerBlock(day, b.id, v);
                        setEditing(null);
                      }}
                      onCancel={() => setEditing(null)}
                    />
                  ) : (
                    <div className="block" key={b.id}>
                      <button className="b-edit" onClick={() => setEditing({ day, id: b.id })} aria-label="Edit">
                        <PencilIcon />
                      </button>
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
                  )
                )}
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
