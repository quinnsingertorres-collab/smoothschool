"use client";

// Lets any page (not just the sidebar) open the "add a class" modal --
// e.g. the empty state on the dashboard when there are no classes yet.
import React, { createContext, useContext } from "react";

const AddClassContext = createContext<() => void>(() => {});

export function useOpenAddClass() {
  return useContext(AddClassContext);
}

export const AddClassProvider = AddClassContext.Provider;
