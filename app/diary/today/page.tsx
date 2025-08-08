"use client";
import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "good morning.";
  if (h < 18) return "good afternoon.";
  if (h < 22) return "good evening.";
  return "good night.";
}

const hours = Array.from({ length: 24 }, (_, i) => i);
// 4 columns * 6 hour blocks
const timeBlockColumns = [0, 6, 12, 18];

// Hard‑coded sample events (will be wired to calendar later)
const sampleEvents: {
  id: string;
  title: string;
  start: string;
  end: string;
}[] = [
  { id: "1", title: "Breakfast & Plan", start: "07:30", end: "08:15" },
  { id: "2", title: "Focus Sprint", start: "09:00", end: "10:30" },
  { id: "3", title: "Team Sync", start: "11:00", end: "11:30" },
  { id: "4", title: "Deep Work", start: "13:00", end: "15:00" },
  { id: "5", title: "Workout", start: "18:30", end: "19:30" },
];

function parseHM(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

function TodayPage() {
  const greeting = useGreeting();
  const today = useMemo(() => new Date(), []);

  const weekDays = useMemo(() => {
    const start = new Date(today);
    // start from Sunday
    start.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [today]);

  const activeHour = today.getHours() + today.getMinutes() / 60;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="text-center text-lg font-semibold tracking-tight md:text-xl">
          {greeting}
        </h1>
        {/* Week scroller */}
        <div className="mx-auto w-full max-w-4xl overflow-x-auto rounded-md border border-zinc-800 bg-zinc-900 text-zinc-200 shadow-sm">
          <div className="flex min-w-[52rem] divide-x divide-zinc-800 text-xs text-zinc-400">
            {weekDays.map((d) => {
              const isToday = d.toDateString() === today.toDateString();
              const short = d
                .toLocaleDateString(undefined, { weekday: "short" })
                .slice(0, 2);
              return (
                <button
                  key={d.toISOString()}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 py-4 transition-colors",
                    isToday && "bg-zinc-100 text-zinc-900 font-semibold"
                  )}
                >
                  <span className="uppercase tracking-wide">{short}</span>
                  <span className="text-sm">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Time Blocks Container */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Time Blocks</h2>
        <div className="grid grid-cols-4 gap-4">
          {timeBlockColumns.map((start) => {
            const end = start + 6;
            return (
              <div
                key={start}
                className="relative flex h-72 flex-col rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 text-xs"
              >
                <div className="mb-1 text-center text-[10px] font-medium tracking-wide text-zinc-500">
                  {start}:00 - {end}:00
                </div>
                <div className="relative flex-1">
                  {/* Background hour grid */}
                  {hours
                    .filter((h) => h >= start && h < end)
                    .map((h) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-b border-dashed border-zinc-800"
                        style={{ top: `${((h - start) / 6) * 100}%` }}
                      />
                    ))}
                  {/* Events */}
                  {sampleEvents
                    .filter((e) => {
                      const s = parseHM(e.start);
                      return s >= start && s < end;
                    })
                    .map((e) => {
                      const s = parseHM(e.start);
                      const f = parseHM(e.end);
                      const top = ((s - start) / 6) * 100;
                      const height = ((f - s) / 6) * 100;
                      const active = activeHour >= s && activeHour < f;
                      return (
                        <div
                          key={e.id}
                          className={cn(
                            "absolute left-1 right-1 rounded-md border px-2 py-1 text-[10px] font-medium shadow-sm",
                            active
                              ? "bg-zinc-100 text-zinc-900 border-zinc-300"
                              : "bg-zinc-800/70 text-zinc-200 border-zinc-700"
                          )}
                          style={{ top: `${top}%`, height: `${height}%` }}
                        >
                          <div className="line-clamp-3 leading-tight">
                            {e.title}
                          </div>
                          <div className="mt-0.5 text-[9px] font-normal opacity-70">
                            {e.start} – {e.end}
                          </div>
                        </div>
                      );
                    })}
                  {/* Active indicator line if inside this block */}
                  {activeHour >= start && activeHour < end && (
                    <div
                      className="pointer-events-none absolute left-0 right-0 h-0.5 -translate-y-1/2 bg-zinc-100"
                      style={{ top: `${((activeHour - start) / 6) * 100}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Reflection */}
      <section className="py-14 text-center">
        <div className="mx-auto w-full max-w-3xl rounded-xl border border-zinc-800 bg-zinc-950/60 px-10 py-8 text-sm leading-relaxed shadow-sm backdrop-blur-sm">
          <p className="mb-1 font-semibold text-zinc-100">
            on minding the business.
          </p>
          <p className="mb-4 text-[11px] uppercase tracking-wide text-zinc-500">
            Day 5 of 7
          </p>
          <p className="text-sm">
            How would your life look different if you spent more time minding
            your own business?
          </p>
        </div>
        <Button
          variant="default"
          className="mt-8 w-44 rounded-full bg-zinc-100 text-zinc-900 font-medium tracking-wide hover:bg-white focus-visible:ring-zinc-400/40"
        >
          Reflect
        </Button>
      </section>

      {/* Quote */}
      <footer className="flex justify-center pb-10 text-sm text-zinc-400">
        &ldquo;The days are long but the decades are short.&rdquo; — Sam Altman
      </footer>
    </div>
  );
}

export default TodayPage;
