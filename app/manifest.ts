import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SmoothSchool",
    short_name: "SmoothSchool",
    description: "Homework, projects, schedule and after-school planning for every class, in one place.",
    start_url: "/home",
    // Everything under "/" (Today, every class page, Planner, Schedule) stays
    // inside the installed app's standalone chrome -- without this, iOS can
    // treat navigation to a new path (like a class page) as leaving the
    // app's scope and show Safari's address bar again.
    scope: "/",
    display: "standalone",
    background_color: "#faf8fc",
    theme_color: "#4C1D95",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
