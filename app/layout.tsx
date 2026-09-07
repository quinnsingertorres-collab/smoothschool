import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmoothSchool",
  description: "Homework, projects, schedule and after-school planning for every class, in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
