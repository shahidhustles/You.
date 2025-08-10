"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/nextjs";
// AI feedback is requested via an internal API to avoid importing server actions in client components
// CSS-based transition animations; no external motion lib needed

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type Frequency =
  | "never"
  | "several_days"
  | "more_than_half_days"
  | "nearly_every_day";
type FocusArea =
  | "reduce_stress"
  | "improve_sleep"
  | "boost_energy"
  | "build_healthy_habits";

const emojiOptions = [
  { emoji: "😞", value: 1, label: "Low" },
  { emoji: "😐", value: 2, label: "Okay" },
  { emoji: "🙂", value: 3, label: "Good" },
  { emoji: "😃", value: 4, label: "Great" },
];

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-[0_0_40px_-20px_rgba(255,255,255,0.2)]">
      {children}
    </div>
  );
}

function StepFrame({
  step,
  children,
}: {
  step: number;
  children: React.ReactNode;
}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    setInView(false);
    const id = requestAnimationFrame(() => setInView(true));
    return () => cancelAnimationFrame(id);
  }, [step]);
  return (
    <div
      key={step}
      className={`will-change-transform transform transition-all duration-300 ${
        inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
      }`}
    >
      {children}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const [step, setStep] = useState<Step>(0);
  const [moodScore, setMoodScore] = useState<number | null>(null);
  // Step 2: emoji-based 5-point selectors (1..5). We'll convert to 0..10 for backend.
  const [lifestyle, setLifestyle] = useState({
    sleepQuality: 3 as 1 | 2 | 3 | 4 | 5,
    energyLevel: 3 as 1 | 2 | 3 | 4 | 5,
    stressLevel: 3 as 1 | 2 | 3 | 4 | 5,
    socialConnection: 3 as 1 | 2 | 3 | 4 | 5,
  });
  const [assessment, setAssessment] = useState<{
    anxietyFrequency: Frequency;
    interestLossFrequency: Frequency;
  }>({
    anxietyFrequency: "several_days",
    interestLossFrequency: "several_days",
  });
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [aiResponse, setAiResponse] = useState<{
    personalizedGreeting: string;
    strengthHighlight: string;
    dailySuggestion: string;
    fullResponse: string;
    actionType:
      | "meditation"
      | "journaling"
      | "breathing"
      | "movement"
      | "reflection"
      | "mindfulness";
  } | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const clerkUserId = user?.id;
  const needsOnboarding = useQuery(
    api.users.needsOnboarding,
    clerkUserId ? { clerkUserId } : "skip"
  );
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const startOnboarding = useMutation(api.users.startOnboarding);
  const updateMoodSnapshot = useMutation(api.users.updateMoodSnapshot);
  const updateLifestyleCheck = useMutation(api.users.updateLifestyleCheck);
  const updateMentalHealthAssessment = useMutation(
    api.users.updateMentalHealthAssessment
  );
  const updateAIReflection = useMutation(api.users.updateAIReflection);
  const updateGoalsAndPreferences = useMutation(
    api.users.updateGoalsAndPreferences
  );
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  useEffect(() => {
    if (!isClerkLoaded || !isSignedIn || !clerkUserId) return;
    (async () => {
      try {
        await getOrCreateUser({
          clerkUserId,
          email: user?.primaryEmailAddress?.emailAddress ?? undefined,
          name: user?.fullName ?? undefined,
          profileImage: user?.imageUrl ?? undefined,
        });
        await startOnboarding({ clerkUserId });
      } catch {}
    })();
  }, [
    isClerkLoaded,
    isSignedIn,
    clerkUserId,
    getOrCreateUser,
    startOnboarding,
    user,
  ]);

  useEffect(() => {
    if (needsOnboarding && needsOnboarding.needsOnboarding === false) {
      router.replace("/diary/today");
    }
  }, [needsOnboarding, router]);

  function next() {
    setStep((s) => Math.min(s + 1, 6) as Step);
  }

  // Right-swipe gesture can be reintroduced later if needed; animations now auto-play on step change.

  async function submitStep1(value: number) {
    setMoodScore(value);
    if (clerkUserId) {
      await updateMoodSnapshot({ clerkUserId, moodScore: value });
    }
    next();
  }

  async function submitStep2() {
    if (clerkUserId) {
      const to10 = (v: 1 | 2 | 3 | 4 | 5) => v * 2;
      await updateLifestyleCheck({
        clerkUserId,
        sleepQuality: to10(lifestyle.sleepQuality),
        energyLevel: to10(lifestyle.energyLevel),
        stressLevel: to10(lifestyle.stressLevel),
        socialConnection: to10(lifestyle.socialConnection),
      });
    }
    next();
  }

  async function submitStep3() {
    if (clerkUserId) {
      await updateMentalHealthAssessment({
        clerkUserId,
        ...assessment,
      });
    }

    if (clerkUserId && moodScore) {
      setIsGeneratingAI(true);
      try {
        const res = await fetch("/api/onboarding/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moodScore,
            lifestyle: {
              sleepQuality: lifestyle.sleepQuality * 2,
              energyLevel: lifestyle.energyLevel * 2,
              stressLevel: lifestyle.stressLevel * 2,
              socialConnection: lifestyle.socialConnection * 2,
            },
            assessment,
            focusAreas,
          }),
        });
        const aiResult = (await res.json()) as {
          success: boolean;
          data?: {
            personalizedGreeting: string;
            strengthHighlight: string;
            dailySuggestion: string;
            fullResponse: string;
            actionType:
              | "meditation"
              | "journaling"
              | "breathing"
              | "movement"
              | "reflection"
              | "mindfulness";
          };
        };

        if (aiResult?.success && aiResult.data) {
          setAiResponse(aiResult.data);
          await updateAIReflection({
            clerkUserId,
            personalizedGreeting: aiResult.data.personalizedGreeting,
            strengthHighlight: aiResult.data.strengthHighlight,
            dailySuggestion: aiResult.data.dailySuggestion,
            fullResponse: aiResult.data.fullResponse,
          });
        } else {
          // Fallback to default response if AI fails
          const fallbackResponse = {
            personalizedGreeting:
              "Hey friend, I hear you're feeling a bit drained but resilient.",
            strengthHighlight:
              "You show up even on tough days—consistency is a strength.",
            dailySuggestion:
              "Try a gentle 5-minute walk outside this afternoon.",
            fullResponse:
              "You seem to be carrying some stress, yet your ability to keep going stands out. Focus on one small act of care today—short walk, slow breathing, or a mindful sip of water.",
            actionType: "mindfulness" as const,
          };
          setAiResponse(fallbackResponse);
          await updateAIReflection({
            clerkUserId,
            personalizedGreeting: fallbackResponse.personalizedGreeting,
            strengthHighlight: fallbackResponse.strengthHighlight,
            dailySuggestion: fallbackResponse.dailySuggestion,
            fullResponse: fallbackResponse.fullResponse,
          });
        }
      } catch (error) {
        console.error("Error generating AI feedback:", error);
        // Use fallback response
        const fallbackResponse = {
          personalizedGreeting:
            "Hey friend, I hear you're feeling a bit drained but resilient.",
          strengthHighlight:
            "You show up even on tough days—consistency is a strength.",
          dailySuggestion: "Try a gentle 5-minute walk outside this afternoon.",
          fullResponse:
            "You seem to be carrying some stress, yet your ability to keep going stands out. Focus on one small act of care today—short walk, slow breathing, or a mindful sip of water.",
          actionType: "mindfulness" as const,
        };
        setAiResponse(fallbackResponse);
        await updateAIReflection({
          clerkUserId,
          personalizedGreeting: fallbackResponse.personalizedGreeting,
          strengthHighlight: fallbackResponse.strengthHighlight,
          dailySuggestion: fallbackResponse.dailySuggestion,
          fullResponse: fallbackResponse.fullResponse,
        });
      } finally {
        setIsGeneratingAI(false);
      }
    }
    next();
  }

  async function submitStep5() {
    if (clerkUserId) {
      await updateGoalsAndPreferences({
        clerkUserId,
        focusAreas,
      });
      await completeOnboarding({ clerkUserId });
    }
    router.replace("/diary/today");
  }

  // Show loader while checking if user needs onboarding
  if (!isClerkLoaded || !isSignedIn || needsOnboarding === undefined) {
    return (
      <div className="min-h-[100svh] bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
        <div className="mx-auto flex min-h-[100svh] w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 py-10">
          <Card>
            <div className="flex flex-col items-center gap-4">
              <div className="size-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-100"></div>
              <h2 className="text-xl font-medium">Checking your progress...</h2>
              <p className="text-zinc-400 text-center">
                We&apos;re checking if you&apos;ve already completed the
                onboarding process.
              </p>
              <div className="w-full space-y-3 mt-4">
                <Skeleton className="h-4 w-3/4 mx-auto bg-zinc-800" />
                <Skeleton className="h-4 w-1/2 mx-auto bg-zinc-800" />
                <Skeleton className="h-10 w-24 mx-auto bg-zinc-800" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 py-10">
        {step === 0 && (
          <Card>
            <StepFrame step={step}>
              <div className="flex flex-col items-center gap-4">
                <h1 className="text-2xl font-semibold">Welcome</h1>
                <p className="text-zinc-400 text-center">
                  I’m here to understand you better and help you feel better.
                </p>
                <Button className="mt-2" onClick={next}>
                  Let’s Begin
                </Button>
              </div>
            </StepFrame>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <StepFrame step={step}>
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-xl font-medium">
                  How are you feeling today?
                </h2>
                <div className="grid grid-cols-4 gap-3 text-3xl">
                  {emojiOptions.map((e) => (
                    <button
                      key={e.value}
                      className={`rounded-xl border border-zinc-800 px-4 py-3 transition ${
                        moodScore === e.value
                          ? "bg-zinc-800"
                          : "hover:bg-zinc-900"
                      }`}
                      onClick={() => submitStep1(e.value)}
                      aria-label={e.label}
                    >
                      <span>{e.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
            </StepFrame>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <StepFrame step={step}>
              <div className="flex flex-col gap-5">
                <h2 className="text-xl font-medium text-center">
                  Lifestyle & Stress Check
                </h2>
                {(
                  [
                    [
                      "sleepQuality",
                      "Sleep Quality",
                      ["😴", "😪", "😐", "🙂", "😌"],
                    ],
                    [
                      "energyLevel",
                      "Energy Level",
                      ["😫", "😕", "😐", "🙂", "⚡️"],
                    ],
                    [
                      "stressLevel",
                      "Stress Level",
                      ["😌", "🙂", "😕", "😣", "😫"],
                    ],
                    [
                      "socialConnection",
                      "Social Connection",
                      ["🥶", "🙃", "🙂", "🤝", "❤️"],
                    ],
                  ] as const
                ).map(([k, label, icons]) => (
                  <div key={k} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>{label}</span>
                      <span className="text-zinc-400">{lifestyle[k]}/5</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-xl">
                      {icons.map((icon, idx) => {
                        const val = (idx + 1) as 1 | 2 | 3 | 4 | 5;
                        const active = lifestyle[k] === val;
                        return (
                          <button
                            key={idx}
                            onClick={() =>
                              setLifestyle((s) => ({ ...s, [k]: val }))
                            }
                            className={`rounded-lg border px-3 py-2 transition ${
                              active
                                ? "border-zinc-600 bg-zinc-900"
                                : "border-zinc-800 hover:bg-zinc-900"
                            }`}
                          >
                            <span>{icon}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <Button className="mt-2" onClick={submitStep2}>
                  Continue
                </Button>
              </div>
            </StepFrame>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <StepFrame step={step}>
              <div className="flex flex-col gap-6">
                <h2 className="text-xl font-medium text-center">
                  Over the last 2 weeks...
                </h2>
                {(
                  [
                    [
                      "anxietyFrequency",
                      "How often have you felt nervous, anxious, or on edge?",
                    ],
                    [
                      "interestLossFrequency",
                      "How often have you felt little interest or pleasure in doing things?",
                    ],
                  ] as const
                ).map(([k, label]) => (
                  <div key={k} className="flex flex-col gap-2">
                    <p className="text-sm">{label}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                      {[
                        ["never", "Never"],
                        ["several_days", "Several days"],
                        ["more_than_half_days", "More than half the days"],
                        ["nearly_every_day", "Nearly every day"],
                      ].map(([val, lbl]) => (
                        <button
                          key={val}
                          onClick={() =>
                            setAssessment((a) => ({
                              ...a,
                              [k]: val as Frequency,
                            }))
                          }
                          className={`rounded-lg border px-3 py-2 text-left transition ${
                            assessment[k] === val
                              ? "border-zinc-600 bg-zinc-900"
                              : "border-zinc-800 hover:bg-zinc-900"
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <Button className="mt-2" onClick={submitStep3}>
                  Continue
                </Button>
              </div>
            </StepFrame>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <StepFrame step={step}>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-zinc-400">Personalized Reflection</p>
                {isGeneratingAI && (
                  <div className="text-zinc-400 text-sm">
                    Generating your suggestion…
                  </div>
                )}
                {aiResponse ? (
                  <>
                    <h3 className="text-lg font-semibold">
                      {aiResponse.personalizedGreeting}
                    </h3>
                    <p className="text-zinc-300">
                      {aiResponse.strengthHighlight}
                    </p>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <div className="text-sm uppercase text-zinc-400 mb-1">
                        Suggestion
                      </div>
                      <div className="text-zinc-200">
                        {aiResponse.dailySuggestion}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => setStep(5)}>
                        Continue
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          // CTA routes user based on actionType
                          const t = aiResponse.actionType;
                          if (t === "journaling" || t === "reflection") {
                            router.replace("/diary/today");
                          } else if (
                            t === "breathing" ||
                            t === "meditation" ||
                            t === "mindfulness"
                          ) {
                            router.replace("/diary/space");
                          } else if (t === "movement") {
                            router.replace("/diary/space");
                          } else {
                            router.replace("/diary/today");
                          }
                        }}
                        aria-label={`Start ${aiResponse.actionType}`}
                      >
                        Start {aiResponse.actionType}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold">
                      Hey friend, I hear you’re feeling a bit drained but
                      resilient.
                    </h3>
                    <p className="text-zinc-300">
                      You show up even on tough days—consistency is a strength.
                    </p>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                      Suggestion: Try a gentle 5-minute walk outside this
                      afternoon.
                    </div>
                    <Button onClick={() => setStep(5)}>Continue</Button>
                  </>
                )}
              </div>
            </StepFrame>
          </Card>
        )}

        {step === 5 && (
          <Card>
            <StepFrame step={step}>
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-medium text-center">
                  What do you want to focus on?
                </h2>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {[
                    ["reduce_stress", "Reduce Stress", "🧘"],
                    ["improve_sleep", "Improve Sleep", "😴"],
                    ["boost_energy", "Boost Energy", "⚡️"],
                    ["build_healthy_habits", "Build Healthy Habits", "🌱"],
                  ].map(([val, lbl, icon]) => {
                    const active = focusAreas.includes(val as FocusArea);
                    return (
                      <button
                        key={val}
                        onClick={() =>
                          setFocusAreas((arr) =>
                            active
                              ? arr.filter((v) => v !== (val as FocusArea))
                              : [...arr, val as FocusArea]
                          )
                        }
                        className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                          active
                            ? "border-zinc-600 bg-zinc-900"
                            : "border-zinc-800 hover:bg-zinc-900"
                        }`}
                      >
                        <span className="text-xl">{icon as string}</span>
                        <span>{lbl}</span>
                      </button>
                    );
                  })}
                </div>
                <Button className="mt-2" onClick={submitStep5}>
                  Finish Onboarding
                </Button>
              </div>
            </StepFrame>
          </Card>
        )}

        {step === 6 && (
          <Card>
            <StepFrame step={step}>
              <div className="flex flex-col items-center gap-4">
                <div className="text-5xl">🏆</div>
                <h2 className="text-xl font-semibold">Onboarding Complete</h2>
                <p className="text-zinc-400">
                  You’ve earned your first streak!
                </p>
                <Button onClick={() => router.replace("/diary/today")}>
                  Go to Dashboard
                </Button>
              </div>
            </StepFrame>
          </Card>
        )}
      </div>
    </div>
  );
}
