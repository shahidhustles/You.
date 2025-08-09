"use client";
import React from "react";
import { useRouter } from "next/navigation";

interface JourneyDayCardProps {
  date: string;
  journalData?: {
    id: string;
    title: string;
    content?: string;
    tags: string[];
    wordCount: number;
  };
  meditationMinutes?: number;
  breathingMinutes?: number;
}

export function JourneyDayCard({
  date,
  journalData,
  meditationMinutes = 0,
  breathingMinutes = 0,
}: JourneyDayCardProps) {
  const router = useRouter();
  const hasActivity =
    journalData || meditationMinutes > 0 || breathingMinutes > 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      dayName: date.toLocaleDateString("en-US", { weekday: "long" }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
    };
  };

  const { dayName, dayNumber, month } = formatDate(date);

  if (!hasActivity) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-6 backdrop-blur-sm">
        <div className="text-center">
          <div className="mb-4">
            <div className="text-2xl font-bold text-zinc-400">{dayNumber}</div>
            <div className="text-sm text-zinc-600">{month}</div>
          </div>
          <p className="text-zinc-500 text-sm">No activity recorded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-700 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 p-6 backdrop-blur-sm transition-all hover:border-zinc-600 hover:from-zinc-900/90 hover:to-zinc-950/90">
      {/* Date Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold text-zinc-200">{dayName}</div>
          <div className="text-sm text-zinc-400">
            {month} {dayNumber}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meditationMinutes > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-300">
              <div className="h-2 w-2 rounded-full bg-purple-400"></div>
              {meditationMinutes}m meditation
            </div>
          )}
          {breathingMinutes > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
              <div className="h-2 w-2 rounded-full bg-blue-400"></div>
              {breathingMinutes}m breathing
            </div>
          )}
        </div>
      </div>

      {/* Journal Content */}
      {journalData && (
        <div
          className="cursor-pointer"
          onClick={() => router.push(`/journal/${journalData.id}`)}
        >
          <div className="mb-3">
            <h3 className="text-lg font-medium text-zinc-100 mb-1 hover:text-white transition-colors">
              {journalData.title}
            </h3>
            {journalData.content && (
              <p className="text-zinc-400 text-sm line-clamp-2">
                {journalData.content.substring(0, 150)}...
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {journalData.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-md hover:bg-zinc-700"
                >
                  {tag}
                </span>
              ))}
              {journalData.tags.length > 3 && (
                <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-md">
                  +{journalData.tags.length - 3}
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-500">
              {journalData.wordCount} words
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
