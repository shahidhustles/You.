import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// Create a new journal entry
export const createJournal = mutation({
  args: {
    title: v.optional(v.string()),
    prompt: v.optional(v.string()),
    isCustomPrompt: v.optional(v.boolean()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const journalId = await ctx.db.insert("journalEntries", {
      clerkUserId: args.userId,
      title: args.title || "New Journal",
      content: undefined,
      prompt: args.prompt,
      isCustomPrompt: args.isCustomPrompt || false,
      wordCount: 0,
      tags: [],
      isPrivate: true,
      isDraft: true,
      lastAutoSaved: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return journalId;
  },
});

// Get a journal entry by ID
export const getJournal = query({
  args: { journalId: v.id("journalEntries"), userId: v.string() },
  handler: async (ctx, args) => {
    const journal = await ctx.db.get(args.journalId);

    // Ensure user can only access their own journals
    if (!journal || journal.clerkUserId !== args.userId) {
      return null;
    }

    return journal;
  },
});

// Update journal title
export const updateJournalTitle = mutation({
  args: {
    journalId: v.id("journalEntries"),
    title: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const journal = await ctx.db.get(args.journalId);
    if (!journal || journal.clerkUserId !== args.userId) {
      throw new Error("Journal not found or access denied");
    }

    await ctx.db.patch(args.journalId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

// Update journal prompt
export const updateJournalPrompt = mutation({
  args: {
    journalId: v.id("journalEntries"),
    prompt: v.string(),
    isCustomPrompt: v.boolean(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const journal = await ctx.db.get(args.journalId);
    if (!journal || journal.clerkUserId !== args.userId) {
      throw new Error("Journal not found or access denied");
    }

    await ctx.db.patch(args.journalId, {
      prompt: args.prompt,
      isCustomPrompt: args.isCustomPrompt,
      updatedAt: Date.now(),
    });
  },
});

// Update journal tags (replace entire set)
export const updateJournalTags = mutation({
  args: {
    journalId: v.id("journalEntries"),
    tags: v.array(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const journal = await ctx.db.get(args.journalId);
    if (!journal || journal.clerkUserId !== args.userId) {
      throw new Error("Journal not found or access denied");
    }

    await ctx.db.patch(args.journalId, {
      tags: args.tags,
      updatedAt: Date.now(),
    });
  },
});

// Save journal content
export const saveJournalContent = mutation({
  args: {
    journalId: v.id("journalEntries"),
    content: v.array(v.any()), // BlockNote blocks as JSON
    wordCount: v.optional(v.number()),
    isDraft: v.optional(v.boolean()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const journal = await ctx.db.get(args.journalId);
    if (!journal || journal.clerkUserId !== args.userId) {
      throw new Error("Journal not found or access denied");
    }

    const finalIsDraft =
      args.isDraft !== undefined ? args.isDraft : journal.isDraft;

    await ctx.db.patch(args.journalId, {
      content: args.content,
      wordCount: args.wordCount || 0,
      isDraft: finalIsDraft,
      lastAutoSaved: Date.now(),
      updatedAt: Date.now(),
    });

    // If entry is saved as non-draft, update streaks
    if (!finalIsDraft) {
      await updateUserStreakForToday(ctx, journal.clerkUserId);
    }
  },
});

// Auto-save journal content (lighter version for frequent updates)
export const autoSaveJournalContent = mutation({
  args: {
    journalId: v.id("journalEntries"),
    content: v.array(v.any()),
    wordCount: v.optional(v.number()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const journal = await ctx.db.get(args.journalId);
    if (!journal || journal.clerkUserId !== args.userId) {
      throw new Error("Journal not found or access denied");
    }

    await ctx.db.patch(args.journalId, {
      content: args.content,
      wordCount: args.wordCount || 0,
      lastAutoSaved: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get user's journal entries
export const getUserJournals = query({
  args: {
    limit: v.optional(v.number()),
    includeDrafts: v.optional(v.boolean()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const includeDrafts =
      args.includeDrafts !== undefined ? args.includeDrafts : true;

    const query = ctx.db
      .query("journalEntries")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.userId))
      .order("desc")
      .take(limit);

    const journals = await query;

    if (!includeDrafts) {
      return journals.filter((journal) => !journal.isDraft);
    }

    return journals;
  },
});

// Delete a journal entry
export const deleteJournal = mutation({
  args: { journalId: v.id("journalEntries"), userId: v.string() },
  handler: async (ctx, args) => {
    const journal = await ctx.db.get(args.journalId);
    if (!journal || journal.clerkUserId !== args.userId) {
      throw new Error("Journal not found or access denied");
    }

    await ctx.db.delete(args.journalId);
  },
});

// Search user's journals with optional text, tag, and date range filters
export const searchUserJournals = query({
  args: {
    userId: v.string(),
    q: v.optional(v.string()),
    tag: v.optional(v.string()),
    startTs: v.optional(v.number()),
    endTs: v.optional(v.number()),
    includeDrafts: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;
    const includeDrafts = args.includeDrafts ?? true;

    const items = await ctx.db
      .query("journalEntries")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.userId))
      .order("desc")
      .take(limit);

    const q = (args.q ?? "").trim().toLowerCase();
    const tag = args.tag;
    const { startTs, endTs } = args;

    const filtered = items.filter((j) => {
      if (!includeDrafts && j.isDraft) return false;
      if (tag && !(j.tags ?? []).includes(tag)) return false;
      if (startTs !== undefined && j.createdAt < startTs) return false;
      if (endTs !== undefined && j.createdAt > endTs) return false;

      if (q) {
        const title = (j.title ?? "").toLowerCase();
        const prompt = (j.prompt ?? "").toLowerCase();
        if (!title.includes(q) && !prompt.includes(q)) return false;
      }
      return true;
    });

    return filtered;
  },
});

// Helpers: streak updating
function todayUtcYmd(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD in UTC
}

function yesterdayUtcYmd(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function updateUserStreakForToday(ctx: MutationCtx, clerkUserId: string) {
  const today = todayUtcYmd();
  const yesterday = yesterdayUtcYmd();

  const existing = await ctx.db
    .query("userStreaks")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
    .take(1);

  const now = Date.now();

  if (!existing || existing.length === 0) {
    await ctx.db.insert("userStreaks", {
      clerkUserId,
      currentStreak: 1,
      longestStreak: 1,
      lastEntryDate: today,
      achievements: [],
      createdAt: now,
      updatedAt: now,
    });
    return;
  }

  const streak = existing[0];

  if (streak.lastEntryDate === today) {
    // Already counted today
    await ctx.db.patch(streak._id, { updatedAt: now });
    return;
  }

  let newCurrent = 1;
  if (streak.lastEntryDate === yesterday) {
    newCurrent = streak.currentStreak + 1;
  }

  const newLongest = Math.max(newCurrent, streak.longestStreak ?? 0);

  await ctx.db.patch(streak._id, {
    currentStreak: newCurrent,
    longestStreak: newLongest,
    lastEntryDate: today,
    updatedAt: now,
  });
}
