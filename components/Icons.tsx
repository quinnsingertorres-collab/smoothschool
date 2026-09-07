// Small hand-drawn icon set shared across the app. Kept as plain inline
// SVG (no icon library) so the whole app ships with zero extra deps.
import React from "react";

type IconProps = { className?: string };
const base = { viewBox: "0 0 24 24", fill: "none" as const };

export function GridIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="2" className={p.className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
export function ClockIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}
export function TableIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={p.className}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="14" y2="18" />
    </svg>
  );
}
export function PlusIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={p.className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
export function ExtLinkIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}
export function TrashIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
      <path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" />
    </svg>
  );
}
export function CheckIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}
export function PencilIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
    </svg>
  );
}
export function XIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={p.className}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}
export function CalendarOffIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3M16 3v3" />
      <path d="M8.5 13l7 5M15.5 13l-7 5" />
    </svg>
  );
}

// Weather glyphs, matched from the NWS shortForecast text.
export function SunIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
    </svg>
  );
}
export function CloudIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <path d="M6.8 18.5a4.3 4.3 0 01-.4-8.6 5.4 5.4 0 0110.5-1.7 4 4 0 01-.6 10.3z" />
    </svg>
  );
}
export function CloudSunIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <path d="M15.5 4v1.8M19.8 7.7l-1.3 1.3M9.3 9l-1.3-1.3" />
      <circle cx="15.5" cy="9.2" r="2.7" />
      <path d="M6.8 19.5a4.1 4.1 0 01-.4-8.2 5.2 5.2 0 016.7-3.5" />
    </svg>
  );
}
export function RainIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <path d="M6.8 14.8a4.3 4.3 0 01-.4-8.6 5.4 5.4 0 0110.5-1.7 4 4 0 01-.6 10.3z" />
      <path d="M8 18.5l-1 2.3M12.5 18.5l-1 2.3M17 18.5l-1 2.3" />
    </svg>
  );
}
export function SnowIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <path d="M6.8 14.8a4.3 4.3 0 01-.4-8.6 5.4 5.4 0 0110.5-1.7 4 4 0 01-.6 10.3z" />
      <path d="M8 18v3M8 18l-1.3 1M8 18l1.3 1M12.5 18v3M12.5 18l-1.3 1M12.5 18l1.3 1M17 18v3M17 18l-1.3 1M17 18l1.3 1" />
    </svg>
  );
}
export function StormIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <path d="M6.8 13.8a4.3 4.3 0 01-.4-8.6 5.4 5.4 0 0110.5-1.7 4 4 0 01-.6 10.3z" />
      <path d="M12.5 14l-2.5 4h3l-2 4.5" />
    </svg>
  );
}
export function FogIcon(p: IconProps) {
  return (
    <svg {...base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <path d="M6.5 12.5a4 4 0 01-.3-8 5 5 0 019.7-1.4" />
      <path d="M4 16h16M6 19.5h12" />
    </svg>
  );
}
