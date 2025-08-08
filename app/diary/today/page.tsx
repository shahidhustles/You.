"use client";
import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import TimeBlock from "@/components/diary/time-block";
import { InspirationCard } from "@/components/diary/inspiration-card";

function useGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "good morning.";
  if (h < 18) return "good afternoon.";
  if (h < 22) return "good evening.";
  return "good night.";
}

function TodayPage() {
  const greeting = useGreeting();
  const today = useMemo(() => new Date(), []);
  const [selectedDay, setSelectedDay] = useState<Date>(today);

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

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="text-center text-lg font-semibold tracking-tight md:text-xl">
          {greeting}
        </h1>
        {/* Week scroller */}
        <div className="mx-auto w-full max-w-4xl overflow-x-auto rounded-md border border-zinc-800 bg-transparent text-zinc-200">
          <div className="flex min-w-[52rem] text-xs">
            {weekDays.map((d) => {
              const isSelected =
                d.toDateString() === selectedDay.toDateString();
              const isToday = d.toDateString() === today.toDateString();
              const short = d
                .toLocaleDateString(undefined, { weekday: "short" })
                .slice(0, 2);
              return (
                <button
                  key={d.toISOString()}
                  className={cn(
                    "relative flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors focus:outline-none",
                    "border-r border-zinc-800 first:border-l",
                    isSelected
                      ? "text-zinc-100 font-semibold"
                      : "text-zinc-500 hover:text-zinc-300",
                    isToday && !isSelected && "text-zinc-300"
                  )}
                  onClick={() => setSelectedDay(d)}
                >
                  <span className="uppercase tracking-wide text-[10px]">
                    {short}
                  </span>
                  <span className="text-sm tabular-nums leading-none">
                    {d.getDate()}
                  </span>
                  {isSelected && (
                    <span className="pointer-events-none absolute inset-x-2 -bottom-0.5 h-0.5 rounded bg-zinc-100" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Time Blocks Container */}
      <TimeBlock date={selectedDay} />

      {/* Inspiration Cards */}
      <section className="py-14">
        <div className="mx-auto w-full max-w-7xl">
          <h2 className="mb-8 text-center text-xl font-semibold text-zinc-100 tracking-tight">
            GET INSPIRED
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Daily Affirmation Card */}
            <InspirationCard
              title="Daily Affirmation"
              content="The peace that I need is inside me."
              buttonText="Embrace the Thought"
              icon={
                <svg
                  className="h-6 w-6 text-zinc-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              }
            />

            {/* Journal Prompt Card */}
            <InspirationCard
              title="Journal Prompt"
              content="Is there something from your past that you miss but is no longer part of your life?"
              buttonText="Write It Out"
              icon={
                <svg
                  className="h-6 w-6 text-zinc-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="m9 12 2 2 4-4" />
                  <path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z" />
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                </svg>
              }
            />

            {/* Quote Card */}
            <InspirationCard
              title="Inspiring Quote"
              content="&ldquo;You can discover more about a person in an hour of play than in a year of conversation.&rdquo;"
              buttonText="Explore More"
              icon={
                <svg
                  className="h-6 w-6 text-zinc-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Quote */}
      <footer className="flex justify-center pb-10 text-sm text-zinc-400">
        &ldquo;The days are long but the decades are short.&rdquo; — Sam Altman
      </footer>
    </div>
  );
}

export default TodayPage;
