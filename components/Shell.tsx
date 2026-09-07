"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { AddClassModal } from "@/components/AddClassModal";
import { AddClassProvider } from "@/components/AddClassContext";

export function Shell({ children }: { children: React.ReactNode }) {
  const [addingClass, setAddingClass] = useState(false);

  return (
    <AddClassProvider value={() => setAddingClass(true)}>
      <div id="app">
        <Sidebar />
        <main id="main">{children}</main>
      </div>
      {addingClass ? <AddClassModal onClose={() => setAddingClass(false)} /> : null}
    </AddClassProvider>
  );
}
