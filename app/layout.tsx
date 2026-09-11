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
  other: {
    // Next's `appleWebApp.capable` only emits the modern, unprefixed
    // "mobile-web-app-capable" tag. Older iOS/iPadOS versions (and some
    // current ones) only honor the classic Apple-prefixed tag to actually
    // hide Safari's address bar in a home-screen-added app -- without it,
    // the icon opens as a regular bookmark with full browser chrome.
    "apple-mobile-web-app-capable": "yes",
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
