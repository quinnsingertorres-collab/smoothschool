// The app lives at the root of its own subdomain (school.sequinn.xyz), so
// there's no path prefix. withBase() stays as the single place to change if
// the app ever moves under a sub-path again: set BASE_PATH (e.g.
// "/schoolmanage") and every plain URL (img src, fetch, web manifest)
// follows; next.config.ts reads the same constant.
export const BASE_PATH = "";

export function withBase(path: string): string {
  return `${BASE_PATH}${path}`;
}
