"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "@/components/DataProvider";
import { GridIcon, ClockIcon, TableIcon, PlusIcon, MenuIcon, XIcon } from "@/components/Icons";
import { useOpenAddClass } from "@/components/AddClassContext";

export function Sidebar() {
  const { classes } = useData();
  const pathname = usePathname();
  const openAddClass = useOpenAddClass();
  const [open, setOpen] = useState(false);

  const isDashboard = pathname === "/" || pathname === "/home";

  // Below the mobile breakpoint the sidebar becomes an off-canvas drawer;
  // put it away automatically whenever the route changes, so tapping a
  // class/nav link both navigates and closes the drawer in one motion.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="mobile-topbar">
        <div className="brand">
          <div className="brand-mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-mark.png" alt="" width={26} height={26} />
          </div>
          <div className="brand-name">SmoothSchool</div>
        </div>
        <button
          type="button"
          className="menu-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      <div
        className={"sidebar-backdrop" + (open ? " open" : "")}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <nav id="sidebar" className={open ? "open" : ""}>
        <div className="brand">
          <div className="brand-mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-mark.png" alt="" width={30} height={30} />
          </div>
          <div className="brand-name">SmoothSchool</div>
        </div>

        <div className="nav-section">
          <Link href="/home" className={"nav-item" + (isDashboard ? " active" : "")}>
            <GridIcon />
            <span className="label">Today</span>
          </Link>
        </div>

        <div className="nav-section">
          <div className="nav-label">Classes</div>
          {classes.map((c) => {
            const active = pathname === `/${c.id}`;
            return (
              <Link key={c.id} href={`/${c.id}`} className={"nav-item" + (active ? " active" : "")}>
                <span className="dot" style={{ background: c.color }} />
                <span className="label">{c.name || "Untitled class"}</span>
                {c.period ? <span className="chip">P{c.period}</span> : null}
              </Link>
            );
          })}
          <button className="nav-add" onClick={openAddClass}>
            <PlusIcon /> Add class
          </button>
        </div>

        <div className="nav-section" style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
          <Link href="/planner" className={"nav-item" + (pathname === "/planner" ? " active" : "")}>
            <ClockIcon />
            <span className="label">Planner</span>
          </Link>
          <Link href="/schedule" className={"nav-item" + (pathname === "/schedule" ? " active" : "")}>
            <TableIcon />
            <span className="label">Schedule</span>
          </Link>
        </div>

        <div className="sidebar-foot">
          Your classes, homework and afternoons — all in one place.
          <form action="/api/logout" method="POST" className="logout-form">
            <button type="submit" className="logout-link">Log out</button>
          </form>
        </div>
      </nav>
    </>
  );
}
