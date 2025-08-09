"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Pause, Play, RotateCcw } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

const clampNumber = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

function MeditationInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useUser();
  const createJournal = useMutation(api.journals.createJournal);
  const saveJournalContent = useMutation(api.journals.saveJournalContent);
  const logMeditation = useMutation(api.meditation.logSession);
  const dashboard = useQuery(
    api.users.getUserDashboardData,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  // Minutes can also be provided via query param ?minutes=10
  const [minutes, setMinutes] = useState(() => {
    const v = Number(params.get("minutes"));
    return Number.isFinite(v) && v > 0 ? clampNumber(v, 1, 180) : 10;
  });

  const totalMs = useMemo(() => minutes * 60 * 1000, [minutes]);

  // UI mode: setup (pre-session) or timer
  const [mode, setMode] = useState<"setup" | "timer">("setup");
  const [running, setRunning] = useState(false);
  const [ended, setEnded] = useState(false);
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const endAtRef = useRef<number | null>(null);
  const loggedRef = useRef(false);

  // Format mm:ss
  const fmt = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const reset = useCallback(() => {
    setRunning(false);
    setEnded(false);
    setRemainingMs(totalMs);
    endAtRef.current = null;
    loggedRef.current = false;
  }, [totalMs]);

  // Keep remaining in sync when minutes change
  useEffect(() => {
    setRemainingMs(totalMs);
    setEnded(false);
    endAtRef.current = null;
  }, [totalMs]);

  // Timer tick
  useEffect(() => {
    if (!running) return;
    const i = setInterval(() => {
      const endAt = endAtRef.current;
      if (!endAt) return;
      const left = endAt - Date.now();
      setRemainingMs(left);
      if (left <= 0) {
        clearInterval(i);
        setRunning(false);
        setEnded(true);
        setRemainingMs(0);
      }
    }, 200);
    return () => clearInterval(i);
  }, [running]);

  const start = useCallback(() => {
    if (running) return;
    setEnded(false);
    if (!endAtRef.current) {
      endAtRef.current = Date.now() + Math.max(0, remainingMs);
    }
    setRunning(true);
    setMode("timer");
  }, [remainingMs, running]);

  // Mark streak on first Start click per day using existing journal flow; avoid duplicates via localStorage
  useEffect(() => {
    if (!running) return;
    const uid = user?.id;
    if (!uid) return;
    const today = new Date().toISOString().slice(0, 10);
    const key = `streak-marked-${uid}-meditation-${today}`;
    if (localStorage.getItem(key)) return;
    const alreadyToday = dashboard?.streakData?.lastEntryDate === today;
    const mark = async () => {
      try {
        if (alreadyToday) {
          localStorage.setItem(key, "1");
          return;
        }
        const journalId = await createJournal({
          userId: uid,
          title: "Meditation Session",
          prompt: "Meditation",
          isCustomPrompt: true,
        });
        await saveJournalContent({
          journalId,
          content: [],
          wordCount: 0,
          isDraft: false,
          userId: uid,
        });
        localStorage.setItem(key, "1");
      } catch {}
    };
    void mark();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, user?.id]);

  const pause = useCallback(() => {
    if (!running) return;
    const endAt = endAtRef.current;
    if (endAt) {
      const left = Math.max(0, endAt - Date.now());
      setRemainingMs(left);
    }
    endAtRef.current = null; // mark paused
    setRunning(false);
  }, [running]);

  // When resuming, rehydrate endAt from remainingMs
  useEffect(() => {
    if (running && !endAtRef.current) {
      endAtRef.current = Date.now() + Math.max(0, remainingMs);
    }
  }, [running, remainingMs]);

  // When a session ends, log minutes to Convex once
  useEffect(() => {
    if (!ended || loggedRef.current) return;
    const uid = user?.id;
    if (!uid) return;
    loggedRef.current = true;
    void logMeditation({ clerkUserId: uid, minutes });
  }, [ended, logMeditation, minutes, user?.id]);

  // Progress percent (0..1)
  const progress = useMemo(() => {
    if (totalMs <= 0) return 0;
    const done = totalMs - Math.max(0, remainingMs);
    return clampNumber(done / totalMs, 0, 1);
  }, [remainingMs, totalMs]);

  return (
    <main className="relative min-h-screen w-full overflow-y-auto px-4 py-6 md:px-8">
      {/* Header */}
      <div className="relative z-10 mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/diary/space")}
        >
          <ChevronLeft className="size-4" /> Back
        </Button>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
          Meditation
        </h1>
      </div>

      {mode === "setup" ? (
        <SetupScreen
          minutes={minutes}
          setMinutes={setMinutes}
          onStart={start}
        />
      ) : (
        <>
          {/* Top progress bar */}
          <div className="pointer-events-none fixed left-0 right-0 top-0 z-10 h-1 bg-zinc-900/60">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-[width] duration-200 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="relative z-10 grid gap-8 md:grid-cols-1">
            {/* Circular countdown timer - Full width when meditating */}
            <section className="flex min-h-[420px] items-center justify-center rounded-2xl border border-zinc-800 bg-transparent p-6">
              <CircularTimer
                remainingMs={Math.max(0, remainingMs)}
                progress={progress}
                running={running}
                ended={ended}
                fmt={fmt}
              />
            </section>

            {/* Timer controls - centered below */}
            <section className="flex justify-center">
              <div className="rounded-2xl  bg-zinc-950/70 p-6">
                <div className="flex items-center justify-between rounded-md  bg-zinc-900/40 p-4 mb-4">
                  <div className="text-sm text-zinc-400 mr-2">Time remaining</div>
                  <div className="font-mono text-2xl text-zinc-200">
                    {fmt(remainingMs)}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  {!running ? (
                    <Button onClick={start} className="gap-2">
                      <Play className="size-4" /> Start
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={pause}
                      className="gap-2"
                    >
                      <Pause className="size-4" /> Pause
                    </Button>
                  )}
                  <Button variant="outline" onClick={reset} className="gap-2">
                    <RotateCcw className="size-4" /> Reset
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </main>
  );
}

export default function MeditationPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-screen items-center justify-center">
          <div className="text-zinc-400">Loading…</div>
        </main>
      }
    >
      <MeditationInner />
    </Suspense>
  );
}

type CircularTimerProps = {
  remainingMs: number;
  progress: number; // 0..1 (done fraction)
  running: boolean;
  ended: boolean;
  fmt: (ms: number) => string;
};

function CircularTimer({
  remainingMs,
  progress,
  running,
  ended,
  fmt,
}: CircularTimerProps) {
  const size = 460; // SVG viewBox edge
  const r = 180; // radius
  const c = useMemo(() => 2 * Math.PI * r, [r]);
  const remaining = useMemo(
    () => 1 - Math.min(1, Math.max(0, progress)),
    [progress]
  );
  const offset = useMemo(() => remaining * c, [remaining, c]);

  return (
    <div className="relative h-[320px] w-[320px] md:h-[460px] md:w-[460px]">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 h-full w-full -rotate-90"
        aria-hidden
      >
        <defs>
          <linearGradient id="med-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(161,161,170,0.25)"
          strokeWidth={14}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#med-grad)"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 200ms linear" }}
        />
      </svg>

      <div className="absolute left-1/2 top-1/2 h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900/30 backdrop-blur-[2px] md:h-[220px] md:w-[220px]" />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-center">
        <div className="font-mono text-3xl tabular-nums text-zinc-100 md:text-4xl">
          {fmt(remainingMs)}
        </div>
        <div className="mt-1 text-xs text-zinc-400">
          {ended ? "Done" : running ? "In session" : "Paused"}
        </div>
      </div>
    </div>
  );
}

type SetupProps = {
  minutes: number;
  setMinutes: (n: number) => void;
  onStart: () => void;
};

function SetupScreen({ minutes, setMinutes, onStart }: SetupProps) {
  return (
    <section className="mx-auto max-w-5xl">
      {/* Big minutes number */}
      <div className="mt-2 flex flex-col items-center justify-center">
        <div className="text-6xl font-extrabold text-zinc-100">{minutes}</div>
        <div className="-mt-1 text-sm uppercase tracking-widest text-zinc-400">
          min
        </div>
      </div>

      {/* Ruler style slider */}
      <div className="relative mx-auto mt-6 max-w-3xl select-none px-4">
        <RulerSlider value={minutes} onChange={setMinutes} min={1} max={60} />
      </div>

      {/* How to */}
      <div className="mt-16 grid gap-4 px-2 md:px-4">
        <h2 className="text-3xl font-bold text-zinc-100">How to</h2>
        <ol className="space-y-3 text-lg text-zinc-300">
          <li>
            <span className="font-semibold text-zinc-100">1.</span> Sit or lie
            comfortably.
          </li>
          <li>
            <span className="font-semibold text-zinc-100">2.</span> Close your
            eyes.
          </li>
          <li>
            <span className="font-semibold text-zinc-100">3.</span> Breathe
            naturally and make no effort to control it.
          </li>
          <li>
            <span className="font-semibold text-zinc-100">4.</span> Focus
            attention on the breath and how the body moves with each inhale and
            exhale.
          </li>
        </ol>

        <div className="mt-8">
          <Button onClick={onStart} className="h-11 px-6 text-base">
            <Play className="mr-2 size-4" /> Start
          </Button>
        </div>
      </div>
    </section>
  );
}

type RulerSliderProps = {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
};

function RulerSlider({ value, onChange, min = 1, max = 60 }: RulerSliderProps) {
  const ticks: number[] = [];
  for (let i = min; i <= max; i++) ticks.push(i);
  return (
    <div className="w-full">
      <div className="relative mb-6 h-8">
        {/* ticks */}
        <div className="absolute inset-0 flex items-center">
          <div className="h-[1px] w-full bg-zinc-800" />
        </div>
        <div className="absolute inset-0 flex justify-between">
          {ticks.map((t) => (
            <div key={t} className="flex flex-col items-center">
              <div
                className={`${t % 5 === 0 ? "h-4" : "h-2"} w-[2px] bg-zinc-600`}
              />
            </div>
          ))}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(clampNumber(Number(e.target.value), min, max))
        }
        className="w-full [--tw-shadow:0_0] [accent-color:#a78bfa]"
      />
      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>{min}m</span>
        <span>{max}m</span>
      </div>
    </div>
  );
}

// function BackgroundVideoMeditation() {
//   const videoRef = useRef<HTMLVideoElement | null>(null);

//   // Pause when tab is hidden to save resources
//   useEffect(() => {
//     const onVis = () => {
//       const v = videoRef.current;
//       if (!v) return;
//       try {
//         if (document.hidden) v.pause();
//         else v.play().catch(() => {});
//       } catch {}
//     };
//     document.addEventListener("visibilitychange", onVis);
//     return () => document.removeEventListener("visibilitychange", onVis);
//   }, []);

//   return (
//     <>
//       <video
//         ref={videoRef}
//         className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover opacity-30 blur-[2px] saturate-125 motion-reduce:hidden"
//         autoPlay
//         loop
//         muted
//         playsInline
//         preload="none"
//         aria-hidden
//       >
//         <source src="/bg-meditation.webm" type="video/webm" />
//         <source src="/bg-meditation.mp4" type="video/mp4" />
//       </video>
//       <div
//         className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-zinc-950/25 via-zinc-950/15 to-zinc-950/25"
//         aria-hidden
//       />
//     </>
//   );
// }
