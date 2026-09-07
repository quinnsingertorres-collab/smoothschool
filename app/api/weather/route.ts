import { NextResponse } from "next/server";

// Medford, MA. The National Weather Service API is free, keyless, and
// asks only for an identifying User-Agent -- no API key to manage or
// leak, which is why this runs server-side instead of straight from
// the browser.
const LAT = 42.4184;
const LON = -71.1062;
const USER_AGENT = "SmoothSchool weather widget (contact: quinnsingertorres@gmail.com)";

export const revalidate = 1800; // 30 minutes

export async function GET() {
  try {
    const pointsRes = await fetch(`https://api.weather.gov/points/${LAT},${LON}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json" },
      next: { revalidate: 86400 }, // the grid point for a fixed location never changes
    });
    if (!pointsRes.ok) throw new Error(`points lookup failed: ${pointsRes.status}`);
    const points = await pointsRes.json();
    const forecastUrl: string | undefined = points?.properties?.forecast;
    if (!forecastUrl) throw new Error("no forecast url in points response");

    const city = points?.properties?.relativeLocation?.properties?.city;
    const state = points?.properties?.relativeLocation?.properties?.state;
    const place = city && state ? `${city}, ${state}` : "Medford, MA";

    const forecastRes = await fetch(forecastUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json" },
      next: { revalidate },
    });
    if (!forecastRes.ok) throw new Error(`forecast fetch failed: ${forecastRes.status}`);
    const forecast = await forecastRes.json();
    const period = forecast?.properties?.periods?.[0];
    if (!period) throw new Error("no forecast periods returned");

    return NextResponse.json(
      {
        temp: period.temperature as number,
        unit: period.temperatureUnit as string,
        shortForecast: period.shortForecast as string,
        periodName: period.name as string,
        place,
      },
      { headers: { "Cache-Control": `public, max-age=0, s-maxage=${revalidate}, stale-while-revalidate=3600` } }
    );
  } catch {
    return NextResponse.json({ error: "weather unavailable" }, { status: 502 });
  }
}
