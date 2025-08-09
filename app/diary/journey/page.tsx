"use client";
import React, { useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Timeline } from "@/components/ui/timeline";
import { JourneyDayCard } from "@/components/diary/journey-day-card";

interface TimelineData {
  title: string;
  date: string;
  content: React.ReactNode;
}

// Helper function to extract text from BlockNote content
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractTextFromBlocks = (blocks: any[]): string => {
  if (!blocks || !Array.isArray(blocks)) return "";

  return blocks
    .map((block) => {
      if (block?.content) {
        if (Array.isArray(block.content)) {
          return (
            block.content
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((item: any) => item?.text || "")
              .join("")
          );
        }
        return block.content.toString();
      }
      return "";
    })
    .join(" ")
    .trim();
};

const JourneyPage = () => {
  const { user } = useUser();

  // Get past 7 days date range
  const { startDate, endDate, daysList } = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const start = sevenDaysAgo.toISOString().split("T")[0];
    const end = today.toISOString().split("T")[0];

    // Generate list of dates for the past week
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + i);
      days.push(date.toISOString().split("T")[0]);
    }

    return {
      startDate: start,
      endDate: end,
      daysList: days.reverse(), // Most recent first
    };
  }, []);

  // Fetch data from Convex
  const journals = useQuery(
    api.journals.getJournalsByDateRange,
    user?.id ? { userId: user.id, startDate, endDate } : "skip"
  );

  const meditationData = useQuery(
    api.meditation.getRecent,
    user?.id ? { clerkUserId: user.id, days: 7 } : "skip"
  );

  const breathingData = useQuery(
    api.breathing.getRecent,
    user?.id ? { clerkUserId: user.id, days: 7 } : "skip"
  );

  // Process and organize data by date
  const timelineData: TimelineData[] = useMemo(() => {
    if (!journals || !meditationData || !breathingData) return [];

    return daysList.map((dateStr) => {
      // Find journal for this date
      const dayStart = new Date(dateStr).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dayJournal = journals.find((journal) => {
        const journalTime = journal.createdAt;
        return journalTime >= dayStart && journalTime < dayEnd;
      });

      // Find meditation data for this date
      const meditation = meditationData.find((m) => m.date === dateStr);
      const breathing = breathingData.find((b) => b.date === dateStr);

      // Format date for display
      const date = new Date(dateStr);
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

      let journalData;
      if (dayJournal) {
        journalData = {
          id: dayJournal._id,
          title: dayJournal.title || "Untitled",
          content: dayJournal.content
            ? extractTextFromBlocks(dayJournal.content)
            : undefined,
          tags: dayJournal.tags || [],
          wordCount: dayJournal.wordCount || 0,
        };
      }

      return {
        title: dayName,
        date: date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        }),
        journalData,
        meditationMinutes: meditation?.minutes || 0,
        breathingMinutes: breathing?.minutes || 0,
        content: (
          <JourneyDayCard
            date={dateStr}
            journalData={journalData}
            meditationMinutes={meditation?.minutes || 0}
            breathingMinutes={breathing?.minutes || 0}
          />
        ),
      };
    });
  }, [journals, meditationData, breathingData, daysList]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-xl font-semibold bg-gradient-to-b from-zinc-100 to-zinc-400/40 bg-clip-text text-transparent mb-2">
            Please sign in to view your journey
          </div>
          <div className="text-zinc-500">
            Your personal mindfulness timeline awaits
          </div>
        </div>
      </div>
    );
  }

  if (!journals || !meditationData || !breathingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="bg-gradient-to-b from-zinc-100 to-zinc-400/40 bg-clip-text text-transparent">
            Loading your journey...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Timeline data={timelineData} />
    </div>
  );
};

export default JourneyPage;
