"use client";

import React, { useEffect, useState } from "react";
import { MOVE_DEADLINE, MOVED_ACK_KEY, NEW_ORIGIN } from "@/lib/domain-move";
import { withBase } from "@/lib/base-path";

function readAck(): boolean {
  try {
    return localStorage.getItem(MOVED_ACK_KEY) === "1";
  } catch {
    return false;
  }
}

export function MovedNotice() {
  const [expired, setExpired] = useState(false);
  const [ready, setReady] = useState(false);
  const [destination, setDestination] = useState(NEW_ORIGIN);

  useEffect(() => {
    // The old URL is still in the address bar (proxy.ts rewrites, it doesn't
    // redirect), so it tells us which page they were opening.
    const path = window.location.pathname.replace(/^\/schoolmanage(?=\/|$)/, "") || "/";
    const target = path === "/moved" ? "/" : path;
    const dest = NEW_ORIGIN + target + window.location.search;
    setDestination(dest);
    const past = Date.now() > MOVE_DEADLINE.getTime();
    setExpired(past);
    // Already acknowledged once on this browser: go straight to the new site.
    if (!past && readAck()) {
      window.location.replace(dest);
      return;
    }
    setReady(true);
  }, []);

  function acknowledge() {
    try {
      localStorage.setItem(MOVED_ACK_KEY, "1");
    } catch {
      /* private browsing -- they'll just see the notice again next time */
    }
    window.location.replace(destination);
  }

  if (!ready) return <div className="moved-screen" />;

  return (
    <div className="moved-screen">
      <div className="moved-card" role="alertdialog" aria-modal="true" aria-labelledby="moved-title" aria-describedby="moved-body">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={withBase("/brand-mark.png")} alt="" width={44} height={44} className="moved-mark" />
        {expired ? (
          <>
            <h1 id="moved-title">This address no longer works</h1>
            <div id="moved-body" className="moved-body">
              <p>
                SmoothSchool is now at <strong>school.sequinn.xyz</strong>.
              </p>
            </div>
            <a className="btn btn-primary btn-block" href={NEW_ORIGIN}>
              Go to school.sequinn.xyz
            </a>
          </>
        ) : (
          <>
            <h1 id="moved-title">
              This site has been moved to <span className="moved-url">school.sequinn.xyz</span>
            </h1>
            <div id="moved-body" className="moved-body">
              <p>If you have this site bookmarked please make a new one under the new domain.</p>
              <p>
                After 30 days this domain (<span className="moved-old">sequinn.xyz/schoolmanage</span>) will no
                longer work.
              </p>
            </div>
            <button type="button" className="btn btn-primary btn-block" autoFocus onClick={acknowledge}>
              Acknowledge
            </button>
          </>
        )}
      </div>
    </div>
  );
}
