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
import { Input } from "@/components/ui/input";
import { ChevronLeft, Pause, Play, RotateCcw } from "lucide-react";
// Using a built-in circular timer instead of the Threads animation

const clampNumber = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

function MeditationInner() {
  const router = useRouter();
  const params = useSearchParams();

  // Minutes can also be provided via query param ?minutes=10
  const [minutes, setMinutes] = useState(() => {
    const v = Number(params.get("minutes"));
    return Number.isFinite(v) && v > 0 ? clampNumber(v, 1, 180) : 10;
  });

  const totalMs = useMemo(() => minutes * 60 * 1000, [minutes]);

  const [running, setRunning] = useState(false);
  const [ended, setEnded] = useState(false);
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const endAtRef = useRef<number | null>(null);

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
  }, [remainingMs, running]);

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

  // Progress percent (0..1)
  const progress = useMemo(() => {
    if (totalMs <= 0) return 0;
    const done = totalMs - Math.max(0, remainingMs);
    return clampNumber(done / totalMs, 0, 1);
  }, [remainingMs, totalMs]);

  const disabled = running;

  return (
    <main className="relative h-screen w-full overflow-y-auto px-4 py-6 md:px-8">
      {/* Background video (place your meditation file as /bg-meditation.webm and/or /bg-meditation.mp4)
      <BackgroundVideoMeditation /> */}
      {/* Top progress bar */}
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-10 h-1 bg-zinc-900/60">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-[width] duration-200 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

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

      <div className="relative z-10 grid gap-8 md:grid-cols-[1fr,420px]">
        {/* Left: Circular countdown timer */}
        <section className="flex min-h-[420px] items-center justify-center rounded-2xl border border-zinc-800 bg-transparent p-6">
          <CircularTimer
            remainingMs={Math.max(0, remainingMs)}
            progress={progress}
            running={running}
            ended={ended}
            fmt={fmt}
          />
        </section>

        {/* Right: Timer controls */}
        <section className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2 text-sm text-zinc-400">
              Total duration (minutes)
            </label>
            <Input
              type="number"
              min={1}
              max={180}
              step={1}
              value={minutes}
              onChange={(e) =>
                setMinutes(clampNumber(Number(e.target.value || 0), 1, 180))
              }
              disabled={disabled}
              className="col-span-2"
            />

            <div className="col-span-2 flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/40 p-3">
              <div className="text-sm text-zinc-400">Time remaining</div>
              <div className="font-mono text-lg text-zinc-200">
                {fmt(remainingMs)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {!running ? (
              <Button onClick={start} className="gap-2">
                <Play className="size-4" /> Start
              </Button>
            ) : (
              <Button variant="secondary" onClick={pause} className="gap-2">
                <Pause className="size-4" /> Pause
              </Button>
            )}
            <Button variant="outline" onClick={reset} className="gap-2">
              <RotateCcw className="size-4" /> Reset
            </Button>
          </div>

          <div className="pt-2 text-xs text-zinc-500">
            Tip: You can prefill via query param, e.g.{" "}
            <span className="font-mono">?minutes=15</span>
          </div>
        </section>
      </div>
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
