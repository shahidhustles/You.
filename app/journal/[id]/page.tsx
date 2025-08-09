"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CalendarClock, ImagePlus, Shuffle, Save } from "lucide-react";
import JournalEditor from "@/components/diary/journal-editor";
import { Orb } from "react-ai-orb";
import type { Block } from "@blocknote/core";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/nextjs";
import { BASE_SPACES } from "@/lib/spaces";

// Define prompts
const PROMPTS = [
  "What made you smile today?",
  "What's one thing you're grateful for right now?",
  "If today had a headline, what would it be?",
  "What small win did you have today?",
  "What did you learn about yourself this week?",
];

export default function JournalEntryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const journalId = params.id as Id<"journalEntries">;
  const { user, isLoaded } = useUser();

  // Convex mutations and queries
  const journal = useQuery(
    api.journals.getJournal,
    isLoaded && user ? { journalId, userId: user.id } : "skip"
  );
  const updateTitle = useMutation(api.journals.updateJournalTitle);
  const updatePrompt = useMutation(api.journals.updateJournalPrompt);
  const saveContent = useMutation(api.journals.saveJournalContent);
  const updateTags = useMutation(api.journals.updateJournalTags);

  // Local state
  const [promptIndex, setPromptIndex] = useState(0);
  const [journalContent, setJournalContent] = useState<Block[] | undefined>();
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [title, setTitle] = useState("New Journal");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState<Block[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // Initialize data from Convex when loaded
  useEffect(() => {
    if (journal) {
      setTitle(journal.title);
      setSelectedTags(journal.tags ?? []);
      if (journal.prompt) {
        if (journal.isCustomPrompt) {
          setCustomPrompt(journal.prompt);
        } else {
          // Find the index of the prompt in PROMPTS array
          const index = PROMPTS.findIndex((p) => p === journal.prompt);
          if (index !== -1) {
            setPromptIndex(index);
          }
        }
      }
      if (journal.content) {
        setJournalContent(journal.content as Block[]);
        setLastSavedContent(journal.content as Block[]);
      }
    }
  }, [journal]);

  // Apply values from query params if provided (optional)
  useEffect(() => {
    if (!journal || !user) return;

    const tag = searchParams.get("tag");
    const promptFromQuery = searchParams.get("prompt");

    // Apply tag if provided and not already present
    if (tag && !journal.tags?.includes(tag)) {
      const next = Array.from(new Set([...(journal.tags ?? []), tag]));
      setSelectedTags(next);
      updateTags({ journalId, tags: next, userId: user.id }).catch(() => {});
    }

    // Apply prompt if provided and different
    if (promptFromQuery && promptFromQuery !== journal.prompt) {
      setCustomPrompt(promptFromQuery);
      setIsEditingPrompt(false);
      updatePrompt({
        journalId,
        prompt: promptFromQuery,
        isCustomPrompt: true,
        userId: user.id,
      }).catch(() => {});
    }
  }, [journalId, journal, searchParams, updateTags, updatePrompt, user]);

  const dateLabel = React.useMemo(() => {
    if (!isClientMounted || !journal) return "Loading...";
    const opts: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(journal.createdAt).toLocaleString(undefined, opts);
  }, [isClientMounted, journal]);

  const shufflePrompt = () => {
    const newIndex = (promptIndex + 1) % PROMPTS.length;
    setPromptIndex(newIndex);
    setCustomPrompt(""); // Clear custom prompt when shuffling

    // Update in Convex
    if (journalId && user) {
      updatePrompt({
        journalId,
        prompt: PROMPTS[newIndex],
        isCustomPrompt: false,
        userId: user.id,
      });
    }
  };

  const getCurrentPrompt = () => {
    return customPrompt || PROMPTS[promptIndex];
  };

  const calculateWordCount = (content: Block[]): number => {
    // Simplified word count - just return content block count for now
    return content.length * 5;
  };

  const handleContentChange = useCallback((content: Block[]) => {
    // Only update local state; do not persist until Save is clicked
    setJournalContent(content);
  }, []);

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    setIsEditingTitle(false);

    if (journalId && newTitle !== journal?.title && user) {
      try {
        await updateTitle({ journalId, title: newTitle, userId: user.id });
      } catch (error) {
        console.error("Failed to update title:", error);
      }
    }
  };

  const handlePromptChange = async (newPrompt: string) => {
    setCustomPrompt(newPrompt);
    setIsEditingPrompt(false);

    if (journalId && newPrompt !== journal?.prompt && user) {
      try {
        await updatePrompt({
          journalId,
          prompt: newPrompt,
          isCustomPrompt: true,
          userId: user.id,
        });
      } catch (error) {
        console.error("Failed to update prompt:", error);
      }
    }
  };

  const handleSave = async () => {
    if (!journalId || !journalContent || isSaving || !user) return;

    setIsSaving(true);
    try {
      await saveContent({
        journalId,
        content: journalContent,
        wordCount: calculateWordCount(journalContent),
        isDraft: false,
        userId: user.id,
      });
      setLastSavedContent(journalContent);
    } catch (error) {
      console.error("Failed to save journal:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTag = async (tagKey: string) => {
    if (!journalId || !user) return;

    setSelectedTags((prev) => {
      const next = prev.includes(tagKey)
        ? prev.filter((t) => t !== tagKey)
        : [...prev, tagKey];

      // fire-and-forget save (optional tags)
      updateTags({ journalId, tags: next, userId: user.id }).catch(() => {
        // ignore errors for optional feature; could add toast later
      });

      return next;
    });
  };

  // Loading state
  if (!isLoaded || !user || !journal) {
    return (
      <div className="flex flex-1 min-h-0 flex-col gap-6">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <div className="flex min-w-0 flex-col">
              <Skeleton className="h-9 w-48" />
              <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
                <CalendarClock className="size-3.5" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
        </header>
        <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/30">
          <div className="p-6">
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="flex min-w-0 flex-col">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleTitleChange(title)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTitleChange(title);
                  }
                }}
                className="truncate text-3xl font-bold tracking-tight bg-transparent border-none outline-none text-zinc-100 caret-zinc-100"
                autoFocus
              />
            ) : (
              <h1
                className="truncate text-3xl font-bold tracking-tight bg-gradient-to-b from-zinc-100 to-zinc-400/40 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsEditingTitle(true)}
              >
                {title}
              </h1>
            )}
            <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
              <CalendarClock className="size-3.5" />
              <span className="truncate">{dateLabel || "Loading..."}</span>
              <Separator
                orientation="vertical"
                className="mx-1 h-3.5 bg-zinc-700"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleSave}
                  disabled={
                    isSaving ||
                    !journalContent ||
                    JSON.stringify(journalContent) ===
                      JSON.stringify(lastSavedContent)
                  }
                >
                  <Save className="mr-2 size-4" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save journal entry</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost">
                  <ImagePlus className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add image</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Orb size={0.3} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Talk to Mira</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Prompt stripe */}
        <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-300">
          {isEditingPrompt ? (
            <input
              type="text"
              value={customPrompt || PROMPTS[promptIndex]}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onBlur={() =>
                handlePromptChange(customPrompt || PROMPTS[promptIndex])
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handlePromptChange(customPrompt || PROMPTS[promptIndex]);
                }
              }}
              className="flex-1 bg-transparent border-none outline-none text-zinc-300 caret-zinc-300"
              placeholder="Enter your custom prompt..."
              autoFocus
            />
          ) : (
            <span
              className="line-clamp-1 cursor-pointer hover:text-zinc-200 transition-colors flex-1"
              onClick={() => setIsEditingPrompt(true)}
            >
              {getCurrentPrompt()}
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800"
                onClick={shufflePrompt}
              >
                <Shuffle className="mr-2 size-4" /> New prompt
              </Button>
            </TooltipTrigger>
            <TooltipContent>Shuffle a new journaling prompt</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Tags from spaces (excluding breathing and meditation) */}
      <nav
        aria-label="Journal tags"
        className="-mt-2 flex items-center gap-2 overflow-x-auto pb-1"
      >
        {BASE_SPACES.map((space) => {
          const active = selectedTags.includes(space.key);
          return (
            <button
              key={space.key}
              type="button"
              onClick={() => toggleTag(space.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors ${
                active
                  ? "border border-zinc-600 bg-zinc-800/70 text-zinc-100"
                  : "border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/60 hover:text-zinc-100"
              }`}
            >
              {space.title.replace(/\n/g, " ")}
            </button>
          );
        })}
      </nav>

      {/* Tips */}
      <div className="-mt-3 text-xs text-zinc-500">
        Tip: press <span className="text-zinc-300">/</span> for commands
      </div>

      {/* Journal Editor filling remaining height */}
      <section className="flex-1 min-h-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/30">
        <JournalEditor
          onChange={handleContentChange}
          initialContent={journalContent}
        />
      </section>
    </div>
  );
}
