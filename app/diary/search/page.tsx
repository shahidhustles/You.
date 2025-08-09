"use client";
import React, { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CalendarClock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { BASE_SPACES } from "@/lib/spaces";

const TODAY_KEY = "today";

function startEndOfToday() {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const end = start + 24 * 60 * 60 * 1000 - 1;
  return { start, end };
}

export default function SearchPage() {
  const { user, isLoaded } = useUser();
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [onlyToday, setOnlyToday] = useState(false);

  const dateRange = useMemo(() => {
    if (!onlyToday) return {} as { startTs?: number; endTs?: number };
    const { start, end } = startEndOfToday();
    return { startTs: start, endTs: end };
  }, [onlyToday]);

  const journals = useQuery(
    api.journals.searchUserJournals,
    isLoaded && user
      ? {
          userId: user.id,
          q: q || undefined,
          tag: activeTag || undefined,
          ...dateRange,
          includeDrafts: true,
          limit: 200,
        }
      : "skip"
  );

  const toggleTag = (key: string) => {
    if (key === TODAY_KEY) {
      setOnlyToday((prev) => !prev);
      return;
    }
    setActiveTag((prev) => (prev === key ? null : key));
  };

  return (
    <main className="h-screen w-full overflow-y-auto px-4 py-6 md:px-8">
      <header className="mb-4 flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl bg-gradient-to-b from-zinc-100 to-zinc-400/40 bg-clip-text text-transparent">
          Search
        </h1>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title or prompt..."
              className="pl-9"
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          </div>
        </div>
        <div className="-mt-1 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => toggleTag(TODAY_KEY)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors ${
              onlyToday
                ? "border border-zinc-600 bg-zinc-800/70 text-zinc-100"
                : "border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/60 hover:text-zinc-100"
            }`}
          >
            Today
          </button>
          {BASE_SPACES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => toggleTag(s.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors ${
                activeTag === s.key
                  ? "border border-zinc-600 bg-zinc-800/70 text-zinc-100"
                  : "border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/60 hover:text-zinc-100"
              }`}
            >
              {s.title.replace(/\n/g, " ")}
            </button>
          ))}
        </div>
        <Separator className="bg-zinc-800" />
      </header>

      {!isLoaded || journals === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : journals.length === 0 ? (
        <p className="text-sm text-zinc-500">No results found.</p>
      ) : (
        <ul className="space-y-3">
          {journals.map((j) => (
            <li key={j._id}>
              <Link
                href={`/journal/${j._id}`}
                className="block rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-100">
                      {j.title || "Untitled"}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
                      <CalendarClock className="size-3.5" />
                      <span className="truncate">
                        {new Date(j.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {j.tags && j.tags.length > 0 && (
                    <div className="hidden md:flex flex-wrap items-center gap-1">
                      {j.tags.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-zinc-800 bg-zinc-900/40 px-2 py-0.5 text-[10px] text-zinc-300"
                        >
                          {t}
                        </span>
                      ))}
                      {j.tags.length > 4 && (
                        <span className="text-[10px] text-zinc-400">
                          +{j.tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
