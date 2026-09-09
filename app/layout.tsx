import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmoothSchool",
  description: "Homework, projects, schedule and after-school planning for every class, in one place.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SmoothSchool",
  },
};

export const viewport: Viewport = {
  themeColor: "#4C1D95",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
