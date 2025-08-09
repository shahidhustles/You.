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
import { motion, useAnimationControls } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Pause, Play, RotateCcw } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

type Phase = "inhale" | "hold" | "exhale";

const clampNumber = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

function BreathingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useUser();
  const createJournal = useMutation(api.journals.createJournal);
  const saveJournalContent = useMutation(api.journals.saveJournalContent);
  const logBreathing = useMutation(api.breathing.logSession);
  const dashboard = useQuery(
    api.users.getUserDashboardData,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  const [minutes, setMinutes] = useState(() => {
    const v = Number(params.get("minutes"));
    return Number.isFinite(v) && v > 0 ? clampNumber(v, 1, 60) : 3;
  });
  const [inhale, setInhale] = useState(() => {
    const v = Number(params.get("inhale"));
    return Number.isFinite(v) && v >= 1 ? clampNumber(v, 1, 30) : 4;
  });
  const [hold, setHold] = useState(() => {
    const v = Number(params.get("hold"));
    return Number.isFinite(v) && v >= 0 ? clampNumber(v, 0, 30) : 0;
  });
  const [exhale, setExhale] = useState(() => {
    const v = Number(params.get("exhale"));
    return Number.isFinite(v) && v >= 1 ? clampNumber(v, 1, 30) : 4;
  });

  // UI mode: setup (pre-session) or breathing
  const [mode, setMode] = useState<"setup" | "breathing">("setup");
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [remainingMs, setRemainingMs] = useState(0);
  const [ended, setEnded] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const loggedRef = useRef(false);

  const controls = useAnimationControls();

  const totalMs = useMemo(() => minutes * 60 * 1000, [minutes]);

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
    setPhase("inhale");
    setRemainingMs(totalMs);
    setEnded(false);
    endAtRef.current = null;
    loggedRef.current = false;
    controls.set({ scale: 0.4 });
  }, [controls, totalMs]);

  // Initialize remaining on mount & when minutes change
  useEffect(() => {
    setRemainingMs(totalMs);
  }, [totalMs]);

  // Timer tick for remaining time
  useEffect(() => {
    if (!running) return;
    const i = setInterval(() => {
      const end = endAtRef.current;
      if (!end) return;
      const left = end - Date.now();
      setRemainingMs(left);
      if (left <= 0) {
        clearInterval(i);
        setRunning(false);
        setEnded(true);
      }
    }, 200);
    return () => clearInterval(i);
  }, [running]);

  const runLoopRef = useRef<Promise<void> | null>(null);

  const start = useCallback(async () => {
    if (running) return;
    setEnded(false);
    setRunning(true);
    setMode("breathing");
    if (!endAtRef.current) endAtRef.current = Date.now() + remainingMs;

    const scaleSmall = 0.4;
    const scaleLarge = 1.8;

    const loop = async () => {
      while (endAtRef.current && Date.now() < endAtRef.current) {
        // Inhale
        setPhase("inhale");
        await controls.start(
          { scale: scaleLarge },
          { duration: inhale, ease: "easeInOut" }
        );

        // Hold
        if (hold > 0) {
          setPhase("hold");
          await new Promise((r) => setTimeout(r, hold * 1000));
        }

        // Exhale
        setPhase("exhale");
        await controls.start(
          { scale: scaleSmall },
          { duration: exhale, ease: "easeInOut" }
        );

        // Continue loop until time is up
      }
      setRunning(false);
      setEnded(true);
    };

    runLoopRef.current = loop();
    await runLoopRef.current;
  }, [controls, exhale, hold, inhale, remainingMs, running]);

  // Mark streak on first Start click per day using existing journal flow; avoid duplicates via localStorage
  useEffect(() => {
    if (!running) return;
    const uid = user?.id;
    if (!uid) return;
    const today = new Date().toISOString().slice(0, 10);
    const key = `streak-marked-${uid}-breathing-${today}`;
    if (typeof window !== "undefined" && localStorage.getItem(key)) return;
    const alreadyToday = dashboard?.streakData?.lastEntryDate === today;
    const mark = async () => {
      try {
        if (alreadyToday) {
          localStorage.setItem(key, "1");
          return;
        }
        const journalId = await createJournal({
          userId: uid,
          title: "Breathing Session",
          prompt: "Breathing",
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

  // When a session ends, log minutes to Convex once
  useEffect(() => {
    if (!ended || loggedRef.current) return;
    const uid = user?.id;
    if (!uid) return;
    loggedRef.current = true;
    void logBreathing({ clerkUserId: uid, minutes });
  }, [ended, logBreathing, minutes, user?.id]);

  const pause = useCallback(() => {
    if (!running) return;
    setRunning(false);
    // Freeze end time based on remainingMs already updating via tick
    if (endAtRef.current) {
      const left = Math.max(0, endAtRef.current - Date.now());
      endAtRef.current = Date.now() + left; // keep left stored implicitly
      setRemainingMs(left);
      endAtRef.current = null; // indicate paused
    }
    controls.stop();
  }, [controls, running]);

  // When resuming, rebuild endAt from remainingMs
  useEffect(() => {
    if (running && !endAtRef.current) {
      endAtRef.current = Date.now() + Math.max(0, remainingMs);
    }
  }, [running, remainingMs]);

  // Presets
  const setPreset = (p: "box" | "478" | "calm") => {
    if (p === "box") {
      setInhale(4);
      setHold(4);
      setExhale(4);
    } else if (p === "478") {
      setInhale(4);
      setHold(7);
      setExhale(8);
    } else {
      setInhale(4);
      setHold(0);
      setExhale(6);
    }
  };

  // Keep scale consistent with current phase when inputs change during pause
  useEffect(() => {
    if (!running) {
      controls.set({ scale: phase === "exhale" ? 0.4 : 1.8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

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
          Breathing
        </h1>
      </div>

      {mode === "setup" ? (
        <BreathingSetupScreen
          minutes={minutes}
          setMinutes={setMinutes}
          inhale={inhale}
          setInhale={setInhale}
          hold={hold}
          setHold={setHold}
          exhale={exhale}
          setExhale={setExhale}
          setPreset={setPreset}
          onStart={start}
        />
      ) : (
        <>
          {/* Background video */}
          {/* <BackgroundVideo /> */}
          <div className="relative z-10 grid gap-8 md:grid-cols-1">
            {/* Visual - Full width when breathing */}
            <section className="flex min-h-[420px] items-center justify-center rounded-2xl bg-transparent p-6">
              <div className="relative h-[320px] w-[320px] md:h-[420px] md:w-[420px]">
                {/* Outer rings */}
                <div className="absolute inset-0 rounded-full border-2 border-zinc-700/50" />
                <div className="absolute inset-6 rounded-full border border-zinc-700/40" />
                {/* Animated inner disk */}
                <motion.div
                  className="absolute left-1/2 top-1/2 h-[160px] w-[160px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-700/40 shadow-[0_0_0_40px_rgba(63,63,70,0.35)_inset]"
                  initial={{ scale: 0.4 }}
                  animate={controls}
                />
                {/* Label */}
                <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 select-none text-center text-lg font-medium text-zinc-300">
                  {ended
                    ? "Done"
                    : phase === "inhale"
                      ? "Inhale"
                      : phase === "hold"
                        ? "Hold"
                        : "Exhale"}
                </div>
              </div>
            </section>

            {/* Timer display - centered below animation */}
            <section className="flex justify-center">
              <div className="rounded-2xl b bg-zinc-950/70 p-6">
                <div className="flex items-center justify-between rounded-md  bg-zinc-900/40 p-4">
                  <div className="text-sm text-zinc-400 mr-2">
                    Time remaining{" "}
                  </div>
                  <div className="font-mono text-2xl text-zinc-200">
                    {fmt(remainingMs)}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-4">
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

type BreathingSetupProps = {
  minutes: number;
  setMinutes: (n: number) => void;
  inhale: number;
  setInhale: (n: number) => void;
  hold: number;
  setHold: (n: number) => void;
  exhale: number;
  setExhale: (n: number) => void;
  setPreset: (p: "box" | "478" | "calm") => void;
  onStart: () => void;
};

function BreathingSetupScreen({
  minutes,
  setMinutes,
  inhale,
  setInhale,
  hold,
  setHold,
  exhale,
  setExhale,
  setPreset,
  onStart,
}: BreathingSetupProps) {
  return (
    <section className="mx-auto max-w-5xl">
      {/* Big minutes number */}
      <div className="mt-2 flex flex-col items-center justify-center">
        <div className="text-6xl font-extrabold text-zinc-100">{minutes}</div>
        <div className="-mt-1 text-sm uppercase tracking-widest text-zinc-400">
          min
        </div>
      </div>

      {/* Minute slider */}
      <div className="relative mx-auto mt-6 max-w-3xl select-none px-4">
        <RulerSlider value={minutes} onChange={setMinutes} min={1} max={30} />
      </div>

      {/* Breathing pattern controls */}
      <div className="mt-12 grid gap-6 px-2 md:px-4">
        <h3 className="text-xl font-semibold text-zinc-100">
          Breathing Pattern
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Inhale (sec)
            </label>
            <Input
              type="number"
              min={1}
              max={30}
              value={inhale}
              onChange={(e) =>
                setInhale(clampNumber(Number(e.target.value || 0), 1, 30))
              }
              className="text-center"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Hold (sec)
            </label>
            <Input
              type="number"
              min={0}
              max={30}
              value={hold}
              onChange={(e) =>
                setHold(clampNumber(Number(e.target.value || 0), 0, 30))
              }
              className="text-center"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Exhale (sec)
            </label>
            <Input
              type="number"
              min={1}
              max={30}
              value={exhale}
              onChange={(e) =>
                setExhale(clampNumber(Number(e.target.value || 0), 1, 30))
              }
              className="text-center"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
          <span>Presets:</span>
          <Button size="sm" variant="outline" onClick={() => setPreset("box")}>
            Box 4-4-4
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPreset("478")}>
            4-7-8
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPreset("calm")}>
            Calm 4-6
          </Button>
        </div>
      </div>

      {/* How to */}
      <div className="mt-16 grid gap-4 px-2 md:px-4">
        <h2 className="text-3xl font-bold text-zinc-100">How to</h2>
        <ol className="space-y-3 text-lg text-zinc-300">
          <li>
            <span className="font-semibold text-zinc-100">1.</span> Sit or lie
            comfortably with your back straight.
          </li>
          <li>
            <span className="font-semibold text-zinc-100">2.</span> Close your
            eyes and relax your shoulders.
          </li>
          <li>
            <span className="font-semibold text-zinc-100">3.</span> Follow the
            visual guide to breathe in rhythm.
          </li>
          <li>
            <span className="font-semibold text-zinc-100">4.</span> Focus on the
            breath and let go of distracting thoughts.
          </li>
        </ol>

        <div className="mt-8">
          <Button onClick={onStart} className="h-11 px-6 text-base">
            <Play className="mr-2 size-4" /> Start Breathing
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

function RulerSlider({ value, onChange, min = 1, max = 30 }: RulerSliderProps) {
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

export default function BreathingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-screen items-center justify-center">
          <div className="text-zinc-400">Loading…</div>
        </main>
      }
    >
      <BreathingInner />
    </Suspense>
  );
}

// function BackgroundVideo() {
//   const videoRef = useRef<HTMLVideoElement | null>(null);

//   // Pause the background video when the tab or window is hidden to save resources
//   useEffect(() => {
//     const onVisibility = () => {
//       const v = videoRef.current;
//       if (!v) return;
//       try {
//         if (document.hidden) v.pause();
//         else v.play().catch(() => {});
//       } catch {}
//     };
//     document.addEventListener("visibilitychange", onVisibility);
//     return () => document.removeEventListener("visibilitychange", onVisibility);
//   }, []);

//   return (
//     <>
//       {/* Motion-reduce: hide the video for users who prefer reduced motion */}
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
//         {/* Provide both sources if available; the browser will pick the first it supports */}
//         <source src="/bg-nature.webm" type="video/webm" />
//         <source src="/bg-nature.mp4" type="video/mp4" />
//       </video>
//       {/* Subtle tinted overlay to maintain contrast over the video */}
//       <div
//         className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-zinc-950/25 via-zinc-950/15 to-zinc-950/25"
//         aria-hidden
//       />
//     </>
//   );
// }
