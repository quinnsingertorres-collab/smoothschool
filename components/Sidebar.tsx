"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "@/components/DataProvider";
import { GridIcon, ClockIcon, TableIcon, PlusIcon, XIcon, GearIcon, BookIcon } from "@/components/Icons";
import { useAuth } from "@/components/AuthProvider";
import { useOpenAddClass } from "@/components/AddClassContext";

export function Sidebar() {
  const { classes } = useData();
  const { appName, profile, configured, signOut } = useAuth();
  const pathname = usePathname();
  const openAddClass = useOpenAddClass();
  const [open, setOpen] = useState(false);

  const isDashboard = pathname === "/" || pathname === "/home";
  const isClassPage = classes.some((c) => pathname === `/${c.id}`);

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
          <div className="brand-name">{appName}</div>
        </div>
      </div>

      {/* Phone-only bottom tab bar: the main places one thumb-tap away. */}
      <nav className="mobile-tabbar" aria-label="Main">
        <Link href="/home" className={"tab" + (isDashboard ? " active" : "")}>
          <GridIcon />
          <span>Today</span>
        </Link>
        <button
          type="button"
          className={"tab" + (open || isClassPage ? " active" : "")}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <XIcon /> : <BookIcon />}
          <span>Classes</span>
        </button>
        <Link href="/planner" className={"tab" + (pathname === "/planner" ? " active" : "")}>
          <ClockIcon />
          <span>Planner</span>
        </Link>
        <Link href="/schedule" className={"tab" + (pathname === "/schedule" ? " active" : "")}>
          <TableIcon />
          <span>Schedule</span>
        </Link>
        <Link href="/settings" className={"tab" + (pathname === "/settings" ? " active" : "")}>
          <GearIcon />
          <span>Settings</span>
        </Link>
      </nav>

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
          <div className="brand-name">{appName}</div>
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
          <Link href="/settings" className={"nav-item" + (pathname === "/settings" ? " active" : "")}>
            <GearIcon />
            <span className="label">Settings</span>
          </Link>
        </div>

        <div className="sidebar-foot">
          {configured ? (
            <div className="logout-form">
              {profile?.username ? <span className="signed-in-as">Signed in as {profile.username} · </span> : null}
              <button type="button" className="logout-link" onClick={() => signOut()}>
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </nav>
    </>
  );
}
