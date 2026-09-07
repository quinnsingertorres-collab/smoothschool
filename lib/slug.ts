// Turns a class name into a URL-safe slug used both as the page route
// (/[classname]) and as the Firestore document id, so looking up a class
// page is a direct document read with no extra index or query.
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "class";
}

// These already own a top-level route (see the app/ directory), so a
// class can't take over that URL -- "Home" becomes "home-2" instead of
// shadowing the dashboard at /home.
export const RESERVED_SLUGS = new Set(["home", "planner", "schedule", "api"]);

// Given a desired slug and the set of slugs already in use, returns a
// unique slug by appending -2, -3, ... as needed.
export function uniqueSlug(desired: string, existing: Set<string>): string {
  if (!existing.has(desired) && !RESERVED_SLUGS.has(desired)) return desired;
  let n = 2;
  while (existing.has(`${desired}-${n}`) || RESERVED_SLUGS.has(`${desired}-${n}`)) n++;
  return `${desired}-${n}`;
}
