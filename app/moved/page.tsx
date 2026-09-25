import type { Metadata } from "next";
import { Suspense } from "react";
import { MovedNotice } from "./MovedNotice";

export const metadata: Metadata = {
  title: "SmoothSchool has moved",
  robots: { index: false },
};

export default function MovedPage() {
  return (
    <Suspense fallback={null}>
      <MovedNotice />
    </Suspense>
  );
}
