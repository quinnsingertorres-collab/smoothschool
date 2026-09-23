"use client";

import React, { useState } from "react";
import { useData } from "@/components/DataProvider";
import { PencilIcon, PlusIcon, TrashIcon } from "@/components/Icons";
import { eventBadge, todayISO } from "@/lib/date";
import { ClassData, ClassEvent, EVENT_KIND_LABELS, EventKind } from "@/lib/types";

type EventInput = Omit<ClassEvent, "id">;

function EventForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: EventInput;
  submitLabel: string;
  onSubmit: (v: EventInput) => void;
  onCancel: () => void;
}) {
  return (
    <form
      className="inline-form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = e.currentTarget;
        const title = (f.elements.namedItem("title") as HTMLInputElement).value.trim();
        const date = (f.elements.namedItem("date") as HTMLInputElement).value;
        if (!title || !date) return;
        onSubmit({
          title,
          date,
          kind: (f.elements.namedItem("kind") as HTMLSelectElement).value as EventKind,
          notes: (f.elements.namedItem("notes") as HTMLInputElement).value.trim(),
        });
      }}
    >
      <div className="form-grid">
        <div className="field-row" style={{ gridColumn: "1/-1" }}>
          <label>What</label>
          <input
            type="text"
            name="title"
            required
            defaultValue={initial?.title}
            placeholder="Unit 3 test, vocab quiz, field trip..."
          />
        </div>
        <div className="field-row">
          <label>Type</label>
          <select name="kind" defaultValue={initial?.kind || "test"}>
            <option value="test">Test</option>
            <option value="quiz">Quiz</option>
            <option value="date">Important date</option>
          </select>
        </div>
        <div className="field-row">
          <label>Date</label>
          <input type="date" name="date" required defaultValue={initial?.date} />
        </div>
        <div className="field-row" style={{ gridColumn: "1/-1" }}>
          <label>Notes (optional)</label>
          <input
            type="text"
            name="notes"
            defaultValue={initial?.notes}
            placeholder="Chapters covered, study guide, what to bring..."
          />
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

export function EventRow({ ev, className, color }: { ev: ClassEvent; className?: string; color?: string }) {
  const d = new Date(ev.date + "T00:00:00");
  const valid = !isNaN(d.getTime());
  const b = eventBadge(ev.date);
  return (
    <>
      <div className={"ev-date " + ev.kind} style={color ? { borderColor: color } : undefined}>
        <span className="ev-mon">{valid ? d.toLocaleDateString(undefined, { month: "short" }) : ""}</span>
        <span className="ev-day tabular">{valid ? d.getDate() : "?"}</span>
      </div>
      <div className="ev-main">
        <div className="ev-title">
          {ev.title}
          <span className={"ev-kind " + ev.kind}>{EVENT_KIND_LABELS[ev.kind] || "Date"}</span>
        </div>
        <div className="ev-sub">
          {valid ? d.toLocaleDateString(undefined, { weekday: "long" }) : ""}
          {className ? ` · ${className}` : ""}
          {ev.notes ? ` · ${ev.notes}` : ""}
        </div>
      </div>
      {b.label && b.cls !== "past" ? <span className={"ev-badge " + b.cls}>{b.label}</span> : null}
    </>
  );
}

export function ClassEvents({ c }: { c: ClassData }) {
  const { addEvent, updateEvent, deleteEvent } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const today = todayISO();
  const all = [...(c.events || [])].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = all.filter((e) => e.date >= today);
  const past = all.filter((e) => e.date < today).reverse();

  function renderRow(ev: ClassEvent) {
    if (editingId === ev.id) {
      return (
        <div key={ev.id} style={{ padding: 10 }}>
          <EventForm
            initial={ev}
            submitLabel="Save"
            onSubmit={(v) => {
              updateEvent(c.id, ev.id, v);
              setEditingId(null);
            }}
            onCancel={() => setEditingId(null)}
          />
        </div>
      );
    }
    return (
      <div className={"ev-row" + (ev.date < today ? " past" : "")} key={ev.id}>
        <EventRow ev={ev} />
        <div className="ev-actions">
          <button className="btn-danger-ghost ev-edit" aria-label="Edit" onClick={() => setEditingId(ev.id)}>
            <PencilIcon />
          </button>
          <button className="btn-danger-ghost" aria-label="Delete" onClick={() => deleteEvent(c.id, ev.id)}>
            <TrashIcon />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="section-title">
        Tests &amp; important dates
        <button className="btn btn-sm" onClick={() => setFormOpen((v) => !v)}>
          <PlusIcon /> Add
        </button>
      </div>
      {formOpen ? (
        <EventForm
          submitLabel="Add date"
          onSubmit={(v) => {
            addEvent(c.id, v);
            setFormOpen(false);
          }}
          onCancel={() => setFormOpen(false)}
        />
      ) : null}
      <div className="card">
        {!upcoming.length ? (
          <div className="empty" style={{ border: "none" }}>
            <h3>Nothing coming up</h3>
            <p>Add tests, quizzes and other dates to remember, like a field trip or a form deadline.</p>
          </div>
        ) : (
          upcoming.map(renderRow)
        )}
        {past.length ? (
          <details className="ev-past">
            <summary>
              Past ({past.length})
            </summary>
            {past.map(renderRow)}
          </details>
        ) : null}
      </div>
    </div>
  );
}
