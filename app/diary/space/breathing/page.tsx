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

type Phase = "inhale" | "hold" | "exhale";

const clampNumber = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

function BreathingInner() {
  const router = useRouter();
  const params = useSearchParams();

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

  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [remainingMs, setRemainingMs] = useState(0);
  const [ended, setEnded] = useState(false);
  const endAtRef = useRef<number | null>(null);

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

  const disabled = running;

  return (
    <main className="relative h-screen w-full overflow-y-auto px-4 py-6 md:px-8">
      {/* Background video (place your file in /public as /bg-nature.webm and/or /bg-nature.mp4) */}
      {/* <BackgroundVideo /> */}
      <div className="relative z-10">
        <div className="mb-6 flex items-center gap-3">
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

        <div className="grid gap-8 md:grid-cols-[1fr,420px]">
          {/* Visual */}
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

          {/* Controls */}
          <section className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
            <div className="grid grid-cols-2 gap-4">
              <label className="col-span-2 text-sm text-zinc-400">
                Total duration (minutes)
              </label>
              <Input
                type="number"
                min={1}
                max={60}
                step={1}
                value={minutes}
                onChange={(e) =>
                  setMinutes(clampNumber(Number(e.target.value || 0), 1, 60))
                }
                disabled={disabled}
                className="col-span-2"
              />

              <div className="col-span-2 h-px bg-zinc-800" />

              <label className="text-sm text-zinc-400">Inhale (sec)</label>
              <Input
                type="number"
                min={1}
                max={30}
                value={inhale}
                onChange={(e) =>
                  setInhale(clampNumber(Number(e.target.value || 0), 1, 30))
                }
                disabled={disabled}
              />

              <label className="text-sm text-zinc-400">Hold (sec)</label>
              <Input
                type="number"
                min={0}
                max={30}
                value={hold}
                onChange={(e) =>
                  setHold(clampNumber(Number(e.target.value || 0), 0, 30))
                }
                disabled={disabled}
              />

              <label className="text-sm text-zinc-400">Exhale (sec)</label>
              <Input
                type="number"
                min={1}
                max={30}
                value={exhale}
                onChange={(e) =>
                  setExhale(clampNumber(Number(e.target.value || 0), 1, 30))
                }
                disabled={disabled}
              />

              <div className="col-span-2 flex items-center gap-2 pt-2 text-sm text-zinc-400">
                Presets:
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => setPreset("box")}
                >
                  Box 4-4-4
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => setPreset("478")}
                >
                  4-7-8
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => setPreset("calm")}
                >
                  Calm 4-6
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/40 p-3">
              <div className="text-sm text-zinc-400">Time remaining</div>
              <div className="font-mono text-lg text-zinc-200">
                {fmt(remainingMs)}
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
          </section>
        </div>
      </div>
    </main>
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
