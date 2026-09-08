"use client";

import React from "react";
import { DAY_KEYS, DAY_LABELS, DayKey } from "@/lib/types";

export function DayPicker({ value, onChange }: { value: DayKey[]; onChange: (days: DayKey[]) => void }) {
  function toggle(day: DayKey) {
    if (value.includes(day)) onChange(value.filter((d) => d !== day));
    else onChange([...value, day]);
  }
  return (
    <div className="day-picker">
      {DAY_KEYS.map((d) => (
        <button
          type="button"
          key={d}
          className={"day-chip" + (value.includes(d) ? " selected" : "")}
          onClick={() => toggle(d)}
        >
          {DAY_LABELS[d]}
        </button>
      ))}
    </div>
  );
}

export function formatDays(days: DayKey[] | undefined): string {
  if (!days || !days.length) return "Every school day";
  return days.map((d) => DAY_LABELS[d]).join(", ");
}
