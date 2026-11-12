"use client"

import { useState, useEffect } from "react";

type TimeUnit = "Days" | "Hours" | "Minutes" | "Seconds";
type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

const TimeBlock = ({ value, unit }: { value: number | null; unit: TimeUnit }) => (
  <div className="flex flex-col items-center">
    <div className="text-2xl md:text-4xl font-bold text-primary tabular-nums">
      {value === null ? "--" : String(value).padStart(2, '0')}
    </div>
    <div className="text-xs text-muted-foreground">{unit}</div>
  </div>
);

function getTimeLeft(target: number): TimeLeft {
  const difference = Math.max(0, target - Date.now());
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

/** Counts down to `targetDate`, an ISO date-time with an explicit offset (e.g. "2026-11-23T23:59:59+05:30"). */
export function Countdown({ targetDate }: { targetDate: string }) {
  // Starts empty so the server render and the first client render match.
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    const tick = () => {
      setTimeLeft(getTimeLeft(target));
      if (Date.now() >= target) clearInterval(timer);
    };
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex space-x-4 md:space-x-8">
      <TimeBlock value={timeLeft?.days ?? null} unit="Days" />
      <TimeBlock value={timeLeft?.hours ?? null} unit="Hours" />
      <TimeBlock value={timeLeft?.minutes ?? null} unit="Minutes" />
      <TimeBlock value={timeLeft?.seconds ?? null} unit="Seconds" />
    </div>
  );
}
