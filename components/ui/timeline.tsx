"use client";
import { useScroll, useTransform, motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  date: string;
  content: React.ReactNode;
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

export const Timeline = ({
  data,
  className = "",
}: {
  data: TimelineEntry[];
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className={`w-full bg-black font-sans md:px-10 ${className}`}
      ref={containerRef}
    >
      <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10">
        <h2 className="text-lg md:text-4xl font-semibold mb-4 bg-gradient-to-b from-zinc-100 to-zinc-400/40 bg-clip-text text-transparent max-w-4xl">
          Your Journey This Week
        </h2>
        <p className="text-zinc-300 text-sm md:text-base max-w-sm">
          A timeline of your mindfulness journey, journal entries, and daily
          practices.
        </p>
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:pt-40 md:gap-10"
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
              </div>
              <div className="hidden md:block md:pl-20">
                <h3 className="text-xl md:text-3xl font-bold bg-gradient-to-b from-zinc-100 to-zinc-400/40 bg-clip-text text-transparent mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-500">{item.date}</p>
              </div>
            </div>

            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              <div className="md:hidden block mb-4">
                <h3 className="text-2xl font-bold bg-gradient-to-b from-zinc-100 to-zinc-400/40 bg-clip-text text-transparent mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-500">{item.date}</p>
              </div>
              {item.content}
            </div>
          </div>
        ))}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-zinc-700 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0  w-[2px] bg-gradient-to-t from-purple-500 via-blue-500 to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
