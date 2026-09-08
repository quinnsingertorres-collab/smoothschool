"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useData } from "@/components/DataProvider";
import { PencilIcon, TrashIcon, PlusIcon, ExtLinkIcon, CheckIcon } from "@/components/Icons";
import { DayPicker, formatDays } from "@/components/DayPicker";
import { fmtDate, dueBadge } from "@/lib/date";
import { CLASS_COLORS, DayKey, ProjectItem } from "@/lib/types";

function hexToSoft(hex: string) {
  if (!hex || hex.length !== 7) return "var(--surface)";
  return `color-mix(in srgb, ${hex} 10%, var(--surface))`;
}

function linkHref(url: string) {
  const u = url.trim();
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export function ClassPageClient({ slug }: { slug: string }) {
  const { classById, updateClassInfo, deleteClass, addHomework, toggleHomework, deleteHomework, addProject, setProjectStatus, deleteProject } =
    useData();
  const c = classById(slug);

  const [editingInfo, setEditingInfo] = useState(false);
  const [hwFormOpen, setHwFormOpen] = useState(false);
  const [projFormOpen, setProjFormOpen] = useState(false);
  const [editColor, setEditColor] = useState<string | null>(null);
  const [editDays, setEditDays] = useState<DayKey[]>([]);

  if (!c) {
    return (
      <div className="empty">
        <h3>Class not found</h3>
        <p>It may have been deleted, or the link is off.</p>
        <Link href="/home" className="btn btn-primary">
          Back to Today
        </Link>
      </div>
    );
  }

  const hw = [...(c.homework || [])].sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  const projects = [...(c.projects || [])].sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">Class</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-sm"
            onClick={() => {
              setEditColor(c.color);
              setEditDays(c.days || []);
              setEditingInfo((v) => !v);
            }}
          >
            <PencilIcon /> Edit details
          </button>
          <button
            className="btn btn-sm"
            style={{ color: "var(--danger)", borderColor: "var(--danger-soft)" }}
            onClick={() => {
              if (confirm(`Delete "${c.name || "this class"}" and all its homework and projects?`)) {
                deleteClass(c.id);
              }
            }}
          >
            <TrashIcon /> Delete class
          </button>
        </div>
      </div>

      <div className="class-banner" style={{ background: hexToSoft(c.color) }}>
        <div className="accent-bar" style={{ background: c.color }} />
        {editingInfo ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget;
              updateClassInfo(c.id, {
                name: (f.elements.namedItem("name") as HTMLInputElement).value.trim(),
                period: (f.elements.namedItem("period") as HTMLInputElement).value.trim(),
                teacher: (f.elements.namedItem("teacher") as HTMLInputElement).value.trim(),
                room: (f.elements.namedItem("room") as HTMLInputElement).value.trim(),
                contact: (f.elements.namedItem("contact") as HTMLInputElement).value.trim(),
                classroomLink: (f.elements.namedItem("classroomLink") as HTMLInputElement).value.trim(),
                driveLink: (f.elements.namedItem("driveLink") as HTMLInputElement).value.trim(),
                color: editColor || c.color,
                days: editDays,
              });
              setEditingInfo(false);
            }}
          >
            <div className="field-row" style={{ marginBottom: 12 }}>
              <label>Class name</label>
              <input
                type="text"
                name="name"
                required
                defaultValue={c.name}
                style={{ fontSize: 18, fontFamily: "Fraunces, serif", fontWeight: 600 }}
              />
            </div>
            <div className="form-grid">
              <div className="field-row">
                <label>Period</label>
                <input type="text" name="period" defaultValue={c.period} placeholder="3" />
              </div>
              <div className="field-row">
                <label>Teacher</label>
                <input type="text" name="teacher" defaultValue={c.teacher} />
              </div>
              <div className="field-row">
                <label>Room</label>
                <input type="text" name="room" defaultValue={c.room} />
              </div>
              <div className="field-row">
                <label>Contact</label>
                <input type="text" name="contact" defaultValue={c.contact} placeholder="email or phone" />
              </div>
              <div className="field-row" style={{ gridColumn: "1/-1" }}>
                <label>Google Classroom link</label>
                <input type="text" name="classroomLink" defaultValue={c.classroomLink} placeholder="classroom.google.com/c/..." />
              </div>
              <div className="field-row" style={{ gridColumn: "1/-1" }}>
                <label>Google Drive folder link</label>
                <input type="text" name="driveLink" defaultValue={c.driveLink} placeholder="drive.google.com/drive/folders/..." />
              </div>
            </div>
            <div className="field-row" style={{ marginBottom: 12 }}>
              <label>Meets on</label>
              <DayPicker value={editDays} onChange={setEditDays} />
              <div className="sub" style={{ marginTop: 6, fontSize: 12 }}>
                {editDays.length ? `Only ${editDays.length} day${editDays.length === 1 ? "" : "s"} a week` : "Meets every school day"}
              </div>
            </div>
            <div className="field-row" style={{ marginBottom: 10 }}>
              <label>Color</label>
              <div className="swatch-row">
                {CLASS_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    className={"swatch" + (col === editColor ? " selected" : "")}
                    style={{ background: col }}
                    onClick={() => setEditColor(col)}
                    aria-label={`Color ${col}`}
                  />
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingInfo(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Save details
              </button>
            </div>
          </form>
        ) : (
          <>
            <h1>{c.name || "Untitled class"}</h1>
            <div className="meta-grid">
              <MetaItem k="Period" v={c.period ? `Period ${c.period}` : "—"} />
              <MetaItem k="Teacher" v={c.teacher || "—"} />
              <MetaItem k="Room" v={c.room || "—"} />
              <MetaItem k="Contact" v={c.contact || "—"} />
              <MetaItem k="Meets" v={formatDays(c.days)} />
            </div>
            <div className="link-row">
              {c.classroomLink ? (
                <a className="btn btn-sm" target="_blank" rel="noopener" href={linkHref(c.classroomLink)}>
                  <ExtLinkIcon /> Google Classroom
                </a>
              ) : null}
              {c.driveLink ? (
                <a className="btn btn-sm" target="_blank" rel="noopener" href={linkHref(c.driveLink)}>
                  <ExtLinkIcon /> Drive folder
                </a>
              ) : null}
              {!c.classroomLink && !c.driveLink ? (
                <span className="sub" style={{ color: "var(--ink-faint)", fontSize: 12.5 }}>
                  Add a Classroom or Drive link from Edit details.
                </span>
              ) : null}
            </div>
          </>
        )}
      </div>

      {/* Homework */}
      <div className="section">
        <div className="section-title">
          Homework
          <button className="btn btn-sm" onClick={() => setHwFormOpen((v) => !v)}>
            <PlusIcon /> Add
          </button>
        </div>
        {hwFormOpen ? (
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget;
              const title = (f.elements.namedItem("title") as HTMLInputElement).value.trim();
              if (!title) return;
              addHomework(c.id, {
                title,
                dueDate: (f.elements.namedItem("dueDate") as HTMLInputElement).value,
                notes: (f.elements.namedItem("notes") as HTMLInputElement).value.trim(),
              });
              setHwFormOpen(false);
            }}
          >
            <div className="form-grid">
              <div className="field-row" style={{ gridColumn: "1/-1" }}>
                <label>What&apos;s due</label>
                <input type="text" name="title" required placeholder="Read chapter 4, worksheet 3.2..." />
              </div>
              <div className="field-row">
                <label>Due date</label>
                <input type="date" name="dueDate" />
              </div>
              <div className="field-row" style={{ gridColumn: "1/-1" }}>
                <label>Notes (optional)</label>
                <input type="text" name="notes" placeholder="Pages, materials, anything to remember" />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHwFormOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Add homework
              </button>
            </div>
          </form>
        ) : null}
        <div className="card">
          {!hw.length ? (
            <div className="empty" style={{ border: "none" }}>
              <h3>No homework yet</h3>
              <p>Add an assignment to start tracking it.</p>
            </div>
          ) : (
            hw.map((h) => {
              const b = h.dueDate ? dueBadge(h.dueDate) : null;
              return (
                <div className="hw-row" key={h.id}>
                  <button className={"checkbox" + (h.done ? " checked" : "")} onClick={() => toggleHomework(c.id, h.id)}>
                    {h.done ? <CheckIcon /> : null}
                  </button>
                  <div className="hw-main">
                    <div className={"hw-title" + (h.done ? " done" : "")}>{h.title}</div>
                    {h.notes ? <div className="hw-notes">{h.notes}</div> : null}
                    {h.dueDate ? (
                      <div className={"hw-due" + (!h.done && b ? " " + b.cls : "")}>{h.done ? fmtDate(h.dueDate) : b?.label}</div>
                    ) : null}
                  </div>
                  <button className="btn-danger-ghost" onClick={() => deleteHomework(c.id, h.id)}>
                    <TrashIcon />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Projects */}
      <div className="section">
        <div className="section-title">
          Projects
          <button className="btn btn-sm" onClick={() => setProjFormOpen((v) => !v)}>
            <PlusIcon /> Add
          </button>
        </div>
        {projFormOpen ? (
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget;
              const title = (f.elements.namedItem("title") as HTMLInputElement).value.trim();
              if (!title) return;
              addProject(c.id, {
                title,
                dueDate: (f.elements.namedItem("dueDate") as HTMLInputElement).value,
                status: (f.elements.namedItem("status") as HTMLSelectElement).value as ProjectItem["status"],
                notes: (f.elements.namedItem("notes") as HTMLInputElement).value.trim(),
              });
              setProjFormOpen(false);
            }}
          >
            <div className="form-grid">
              <div className="field-row" style={{ gridColumn: "1/-1" }}>
                <label>Project name</label>
                <input type="text" name="title" required placeholder="Ecosystem diorama, lab report..." />
              </div>
              <div className="field-row">
                <label>Due date</label>
                <input type="date" name="dueDate" />
              </div>
              <div className="field-row">
                <label>Status</label>
                <select name="status" defaultValue="not-started">
                  <option value="not-started">Not started</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="field-row" style={{ gridColumn: "1/-1" }}>
                <label>Notes (optional)</label>
                <input type="text" name="notes" placeholder="Requirements, group members..." />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setProjFormOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Add project
              </button>
            </div>
          </form>
        ) : null}
        {!projects.length ? (
          <div className="empty">
            <h3>No projects yet</h3>
            <p>Longer-term work goes here, separate from day-to-day homework.</p>
          </div>
        ) : (
          projects.map((p) => (
            <div className="proj-card" key={p.id}>
              <div>
                <div className="proj-title">{p.title}</div>
                {p.notes ? <div className="proj-notes">{p.notes}</div> : null}
                {p.dueDate ? <div className="proj-due">Due {fmtDate(p.dueDate)}</div> : null}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <select
                  className="status-select"
                  value={p.status}
                  onChange={(e) => setProjectStatus(c.id, p.id, e.target.value as ProjectItem["status"])}
                >
                  <option value="not-started">Not started</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Done</option>
                </select>
                <button className="btn-danger-ghost" onClick={() => deleteProject(c.id, p.id)}>
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MetaItem({ k, v }: { k: string; v: string }) {
  return (
    <div className="meta-item">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}
