import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";

function todayUtcYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

async function upsertDaily(
  ctx: MutationCtx,
  clerkUserId: string,
  date: string,
  addMinutes: number
) {
  const existing = await ctx.db
    .query("breathingDaily")
    .withIndex("by_user_date", (q) =>
      q.eq("clerkUserId", clerkUserId).eq("date", date)
    )
    .unique();

  const now = Date.now();
  if (!existing) {
    await ctx.db.insert("breathingDaily", {
      clerkUserId,
      date,
      minutes: Math.max(0, Math.round(addMinutes)),
      sessions: 1,
      createdAt: now,
      updatedAt: now,
    });
    return;
  }

  await ctx.db.patch(existing._id, {
    minutes: Math.max(0, (existing.minutes ?? 0) + Math.round(addMinutes)),
    sessions: (existing.sessions ?? 0) + 1,
    updatedAt: now,
  });
}

export const logSession = mutation({
  args: {
    clerkUserId: v.string(),
    minutes: v.number(),
    date: v.optional(v.string()), // YYYY-MM-DD UTC; default today
  },
  handler: async (ctx, args) => {
    const date = args.date || todayUtcYmd();
    await upsertDaily(ctx, args.clerkUserId, date, Math.max(0, args.minutes));
    return { ok: true };
  },
});

export const getRecent = query({
  args: { clerkUserId: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = Math.max(1, Math.min(60, args.days ?? 14));
    const items = await ctx.db
      .query("breathingDaily")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .order("desc")
      .take(days * 2); // simple cap
    return items;
  },
});
