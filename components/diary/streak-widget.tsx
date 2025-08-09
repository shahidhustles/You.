"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import type { Doc } from "@/convex/_generated/dataModel";

export type Achievement = {
  type: string;
  unlockedAt: number;
  title: string;
  description: string;
};

export type StreakRecord = Doc<"userStreaks">;

function formatDate(d?: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, day || 1);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * StreakWidget
 * Renders a compact streak UI with a 5-day capsule and achievements.
 */
export default function StreakWidget({
  streak,
}: {
  streak?: StreakRecord | null;
}) {
  const today = useMemo(() => new Date(), []);

  const windowDays = useMemo(() => {
    // 5-day window ending today
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (4 - i));
      return d;
    });
  }, [today]);

  // Determine which days in the 5-day window are part of the current streak
  const checkedSet = useMemo(() => {
    const set = new Set<string>();
    if (!streak?.currentStreak || !streak.lastEntryDate) return set;

    const [y, m, d] = streak.lastEntryDate.split("-").map(Number);
    const last = new Date(y, (m || 1) - 1, d || 1);
    for (let i = 0; i < streak.currentStreak; i++) {
      const dt = new Date(last);
      dt.setDate(last.getDate() - i);
      set.add(dt.toDateString());
    }
    return set;
  }, [streak?.currentStreak, streak?.lastEntryDate]);

  const dayItems = windowDays.map((d) => {
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    const isChecked = checkedSet.has(d.toDateString());
    return { d, label, isChecked };
  });

  const hasAchievements = (streak?.achievements?.length ?? 0) > 0;

  return (
    <section className="mx-auto w-full max-w-4xl">
      <div className="rounded-xl border border-zinc-800/80 bg-transparent px-4 py-5 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-widest text-zinc-200">
            {plural(streak?.currentStreak ?? 0, "DAY").toUpperCase()} STREAK
          </h3>
          <div className="text-xs text-zinc-500">
            Longest: {plural(streak?.longestStreak ?? 0, "day")} • Last Entry:{" "}
            {formatDate(streak?.lastEntryDate)}
          </div>
        </div>

        {/* Hint */}
        <p className="mb-4 text-xs text-zinc-500">
          Perform an action (journal, meditate, etc.) to update the streak.
        </p>

        {/* Five-day capsules */}
        <div className="flex items-end justify-between gap-2 sm:gap-4">
          {dayItems.map(({ d, label, isChecked }) => (
            <div
              key={d.toISOString()}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={cn(
                  "grid size-12 place-items-center rounded-full border text-zinc-200 transition-colors",
                  "border-zinc-700",
                  isChecked ? "bg-zinc-100 text-zinc-900" : "bg-transparent"
                )}
                aria-checked={isChecked}
                role="checkbox"
              >
                {isChecked ? (
                  <svg
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="sr-only">unchecked</span>
                )}
              </div>
              <span className="text-xs text-zinc-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {hasAchievements ? (
            streak!.achievements!.map((a: Achievement) => (
              <Tooltip key={`${a.type}-${a.unlockedAt}`}>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-300">
                    {a.title}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs text-pretty">
                    <div className="mb-0.5 text-xs font-semibold">
                      {a.title}
                    </div>
                    <div className="text-xs text-zinc-100/90">
                      {a.description}
                    </div>
                    <div className="mt-1 text-[10px] text-zinc-300/70">
                      Unlocked {new Date(a.unlockedAt).toLocaleDateString()}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))
          ) : (
            <span className="text-xs text-zinc-500">No achievements yet</span>
          )}
        </div>
      </div>
    </section>
  );
}

export function StreakWidgetSkeleton() {
  return (
    <section className="mx-auto w-full max-w-4xl">
      <div className="rounded-xl border border-zinc-800/80 bg-transparent px-4 py-5 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="flex items-end justify-between gap-2 sm:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="size-12 rounded-full" />
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Skeleton className="h-2 w-24" />
          <Skeleton className="h-2 w-28" />
          <Skeleton className="h-2 w-20" />
        </div>
      </div>
    </section>
  );
}
