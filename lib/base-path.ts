// The app lives under this path on the domain (sequinn.xyz/schoolmanage).
// Next.js adds it to <Link>, router pushes and redirects automatically;
// plain URLs (img src, fetch, the web manifest) use withBase() instead.
// Change it here only -- next.config.ts reads the same constant.
export const BASE_PATH = "/schoolmanage";

export function withBase(path: string): string {
  return `${BASE_PATH}${path}`;
}
