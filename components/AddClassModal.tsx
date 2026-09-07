"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/components/DataProvider";
import { CLASS_COLORS } from "@/lib/types";

export function AddClassModal({ onClose }: { onClose: () => void }) {
  const { addClass, classes } = useData();
  const router = useRouter();
  const [name, setName] = useState("");
  const [period, setPeriod] = useState("");
  const [room, setRoom] = useState("");
  const [teacher, setTeacher] = useState("");
  const [color, setColor] = useState(CLASS_COLORS[classes.length % CLASS_COLORS.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const slug = await addClass({ name: name.trim(), period: period.trim(), room: room.trim(), teacher: teacher.trim(), color });
    onClose();
    router.push(`/${slug}`);
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <h3>Add a class</h3>
        <form onSubmit={handleSubmit}>
          <div className="field-row" style={{ marginBottom: 12 }}>
            <label>Class name</label>
            <input type="text" required autoFocus placeholder="AP Biology" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-grid">
            <div className="field-row">
              <label>Period</label>
              <input type="text" placeholder="3" value={period} onChange={(e) => setPeriod(e.target.value)} />
            </div>
            <div className="field-row">
              <label>Room</label>
              <input type="text" placeholder="204" value={room} onChange={(e) => setRoom(e.target.value)} />
            </div>
            <div className="field-row" style={{ gridColumn: "1/-1" }}>
              <label>Teacher</label>
              <input type="text" value={teacher} onChange={(e) => setTeacher(e.target.value)} />
            </div>
          </div>
          <div className="field-row" style={{ marginBottom: 14 }}>
            <label>Color</label>
            <div className="swatch-row">
              {CLASS_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={"swatch" + (c === color ? " selected" : "")}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Add class
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
