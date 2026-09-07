import type { Metadata } from "next";
import "./globals.css";
import { DataProvider } from "@/components/DataProvider";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "SmoothSchool",
  description: "Homework, projects, schedule and after-school planning for every class, in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DataProvider>
          <Shell>{children}</Shell>
        </DataProvider>
      </body>
    </html>
  );
}
