"use client";

import { DataProvider } from "@/components/DataProvider";
import { Shell } from "@/components/Shell";
import { AuthGate } from "@/components/AuthGate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      {(uid) => (
        <DataProvider userId={uid}>
          <Shell>{children}</Shell>
        </DataProvider>
      )}
    </AuthGate>
  );
}
