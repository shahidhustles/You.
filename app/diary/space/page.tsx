"use client";
import React, { useCallback, useState } from "react";
import { Wind, Leaf, ChevronRight, Loader2 } from "lucide-react";
import GlareHover from "@/components/ui/glare-hover";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type LibraryCard = {
  key: string;
  title: string;
  subtitle?: string;
  description?: string;
  span?: string; // tailwind col-span classes
  icon?: React.ReactNode;
};

const baseCardClasses =
  "group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-sm text-zinc-100 shadow-sm transition-colors hover:border-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500";

const LibraryPage = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const createJournal = useMutation(api.journals.createJournal);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const cards: LibraryCard[] = [
    {
      key: "daily",
      title: "Daily Check-In",
      description: "Pen to page reflections.",
    },
    {
      key: "gratitude",
      title: "Gratitude",
      description: "Capture today's thanks.",
    },
    {
      key: "mood",
      title: "Mood Log",
      description: "Track how you feel.",
    },
    {
      key: "goals",
      title: "Goals",
      description: "Set intentions & aims.",
    },
    {
      key: "arts",
      //TODO : name it something fancy
      title: "Arts & Crafts",
      description: "",
    },
    {
      key: "memories",
      title: "Memories &\nMilestones",
      description: "Journals for every chapter\nof your life.",
    },
    {
      key: "philosophy",
      title: "Philosophy &\nBig Thoughts",
    },
    {
      key: "connections",
      title: "Connections",
      description: "Write about people who\nshape your life.",
    },
    {
      key: "breathing",
      title: "breathing.",
      description: "Breathe in, breathe out.",
      span: "md:col-span-2",
      icon: <Wind className="size-9" />,
    },
    {
      key: "meditation",
      title: "meditation.",
      description: "Wind down and relax.",
      span: "md:col-span-2",
      icon: <Leaf className="size-9" />,
    },
  ];

  const computePrompt = useCallback((card: LibraryCard) => {
    const base = (card.title || "").replace(/\n/g, " ");
    // Simple defaults per key; tweak as desired
    const map: Record<string, string> = {
      daily: "Daily check-in for the day",
      gratitude: "Write a few things you're grateful for today",
      mood: "How are you feeling right now?",
      goals: "Set your intentions and goals",
      arts: "Sketch ideas or reflect on a creative moment",
      memories: "Capture a memory or milestone",
      philosophy: "Explore a big thought or question",
      connections: "Reflect on someone who shaped your day",
    };
    return map[card.key] ?? base;
  }, []);

  const onCardClick = useCallback(
    async (card: LibraryCard) => {
      if (card.key === "breathing" || card.key === "meditation") return;
      if (!isLoaded || !user) return;

      try {
        setLoadingKey(card.key);
        const prompt = computePrompt(card);
        const id = await createJournal({
          title: card.title,
          prompt,
          isCustomPrompt: true,
          userId: user.id,
        });
        const params = new URLSearchParams({
          tag: card.key,
          prompt,
        }).toString();
        router.push(`/journal/${id}?${params}`);
      } finally {
        setLoadingKey(null);
      }
    },
    [computePrompt, createJournal, isLoaded, router, user]
  );

  return (
    <main className="h-screen w-full overflow-y-auto px-4 py-6 md:px-8">
      <header className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-3xl font-bold tracking-tight md:text-4xl bg-gradient-to-b from-zinc-100 to-zinc-400/40 bg-clip-text text-transparent"
        >
          My Headspace
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mt-2 text-sm text-zinc-500"
        >
          Choose a space to journal & reflect.
        </motion.p>
      </header>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4 auto-rows-[180px] md:auto-rows-[240px] pb-8">
        {cards.map((c) => (
          <LibraryGridCard
            key={c.key}
            data={c}
            loading={loadingKey === c.key}
            onClick={() => onCardClick(c)}
          />
        ))}
      </div>
    </main>
  );
};

const LibraryGridCard = ({
  data,
  loading,
  onClick,
}: {
  data: LibraryCard;
  loading?: boolean;
  onClick?: () => void;
}) => {
  const { key, title, description, span, icon } = data;
  const centerIcon = !!icon && (key === "breathing" || key === "meditation");
  return (
    <GlareHover
      width="100%"
      height="100%"
      background="rgba(9,9,11,0.7)"
      borderRadius="1rem"
      borderColor="#27272a"
      className={`${baseCardClasses} place-items-stretch ${span ?? ""}`}
    >
      <motion.button
        layout
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.97 }}
        className="flex h-full w-full flex-col items-start justify-between bg-transparent p-6 text-left disabled:opacity-70"
        disabled={loading}
        onClick={onClick}
      >
        <div className="space-y-3">
          <motion.h3
            layout
            className="whitespace-pre-line text-lg font-semibold leading-snug tracking-tight"
          >
            {title}
          </motion.h3>
          {description && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-400">
              {description}
            </p>
          )}
        </div>
        <div className="relative mt-4 h-14 w-full">
          {icon && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={`pointer-events-none absolute flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/30 text-zinc-400/60 opacity-60 transition-colors group-hover:bg-zinc-700/40 group-hover:opacity-90 ${centerIcon ? "bottom-0 left-1/2 -translate-x-1/2" : "bottom-0 right-0"}`}
            >
              {loading ? <Loader2 className="size-6 animate-spin" /> : icon}
            </motion.div>
          )}
          <motion.div
            className="pointer-events-none absolute right-2 top-2 text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100"
            initial={false}
          >
            {!loading && <ChevronRight className="size-4" />}
          </motion.div>
        </div>
      </motion.button>
    </GlareHover>
  );
};

export default LibraryPage;
