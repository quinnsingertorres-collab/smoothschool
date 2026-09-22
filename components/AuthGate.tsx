"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

// Keeps the app pages behind sign-in. Sends signed-out visitors to /login
// (remembering where they were headed) and hands each signed-in user
// their own data by keying the children on their uid -- switching
// accounts remounts everything below with a clean slate.
export function AuthGate({ children }: { children: (uid: string | null) => React.ReactNode }) {
  const { ready, configured, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const needsLogin = configured && ready && !user;

  useEffect(() => {
    if (needsLogin) {
      const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [needsLogin, pathname, router]);

  if (!ready || needsLogin) {
    return <div className="auth-loading" aria-busy="true" />;
  }
  const uid = user ? user.uid : null;
  return <React.Fragment key={uid || "local"}>{children(uid)}</React.Fragment>;
}
