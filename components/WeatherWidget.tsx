"use client";

import React, { useEffect, useState } from "react";
import { SunIcon, CloudIcon, CloudSunIcon, RainIcon, SnowIcon, StormIcon, FogIcon } from "@/components/Icons";

interface WeatherData {
  temp: number;
  unit: string;
  shortForecast: string;
  periodName: string;
  place: string;
}

function iconFor(shortForecast: string) {
  const s = shortForecast.toLowerCase();
  if (s.includes("thunder") || s.includes("storm")) return StormIcon;
  if (s.includes("snow") || s.includes("flurr") || s.includes("sleet") || s.includes("ice")) return SnowIcon;
  if (s.includes("rain") || s.includes("shower") || s.includes("drizzle")) return RainIcon;
  if (s.includes("fog") || s.includes("haze") || s.includes("mist")) return FogIcon;
  if (s.includes("partly") || s.includes("mostly sunny") || s.includes("mostly clear")) return CloudSunIcon;
  if (s.includes("cloud") || s.includes("overcast")) return CloudIcon;
  if (s.includes("clear") || s.includes("sunny")) return SunIcon;
  return CloudSunIcon;
}

export function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weather")
      .then((res) => {
        if (!res.ok) throw new Error("bad response");
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        if (json.error) throw new Error(json.error);
        setData(json);
        setStatus("ok");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return <div className="weather-pill wt-loading">Checking the weather…</div>;
  }
  if (status === "error" || !data) {
    return <div className="weather-pill wt-error">Weather unavailable right now</div>;
  }

  const Icon = iconFor(data.shortForecast);
  return (
    <div className="weather-pill">
      <Icon />
      <div>
        <div className="wt-temp tabular">
          {data.temp}°{data.unit}
          <span style={{ fontWeight: 500, color: "var(--ink-faint)", marginLeft: 6, fontFamily: '"Public Sans"' }}>
            {data.shortForecast}
          </span>
        </div>
        <div className="wt-place">{data.place}</div>
      </div>
    </div>
  );
}
