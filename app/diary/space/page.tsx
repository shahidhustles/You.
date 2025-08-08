"use client";
import React from "react";
import {
  PenLine,
  Brain,
  Heart,
  Wind,
  Leaf,
  Feather,
  Sun,
  Smile,
  Target,
} from "lucide-react";
import { motion } from "motion/react";

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
  const cards: LibraryCard[] = [
    {
      key: "daily",
      title: "Daily Check-In",
      description: "Pen to page reflections.",
      icon: <PenLine className="size-9" />,
    },
    {
      key: "gratitude",
      title: "Gratitude",
      description: "Capture today's thanks.",
      icon: <Sun className="size-9" />,
    },
    {
      key: "mood",
      title: "Mood Log",
      description: "Track how you feel.",
      icon: <Smile className="size-9" />,
    },
    {
      key: "goals",
      title: "Goals",
      description: "Set intentions & aims.",
      icon: <Target className="size-9" />,
    },
    {
      key: "arts",
      title: "Arts & Crafts",
      description: "",
      icon: <Feather className="size-9" />,
    },
    {
      key: "memories",
      title: "Memories &\nMilestones",
      description: "Journals for every chapter\nof your life.",
      icon: <Heart className="size-9" />,
    },
    {
      key: "philosophy",
      title: "Philosophy &\nBig Thoughts",
      icon: <Brain className="size-9" />,
    },
    {
      key: "connections",
      title: "Connections",
      description: "Write about people who\nshape your life.",
      icon: <Heart className="size-9" />,
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
          <LibraryGridCard key={c.key} data={c} />
        ))}
      </div>
    </main>
  );
};

const LibraryGridCard = ({ data }: { data: LibraryCard }) => {
  const { title, description, span, icon } = data;
  return (
    <motion.button
      layout
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      className={`${baseCardClasses} flex flex-col items-start justify-between p-6 text-left ${span ?? ""}`}
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

      {/* Icon */}
      <div className="relative mt-4 h-14 w-full">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-0 left-0 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/50 text-zinc-300 group-hover:bg-zinc-700/60"
        >
          {icon}
        </motion.div>
        <motion.div
          className="pointer-events-none absolute right-2 top-2 text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100"
          initial={false}
          animate={{ x: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          →
        </motion.div>
      </div>
    </motion.button>
  );
};

export default LibraryPage;
