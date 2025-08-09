import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============ USER MANAGEMENT ============

/**
 * Get or create user by Clerk ID
 * Returns user data and onboarding status
 */
export const getOrCreateUser = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try to find existing user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    if (existingUser) {
      return existingUser;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      name: args.name,
      profileImage: args.profileImage,
      onboardingCompleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Initialize user streak record
    await ctx.db.insert("userStreaks", {
      userId,
      clerkUserId: args.clerkUserId,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});

/**
 * Get user by Clerk ID
 */
export const getUserByClerkId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();
  },
});

/**
 * Check if user needs onboarding
 */
export const needsOnboarding = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    if (!user) {
      return { needsOnboarding: true, isNewUser: true };
    }

    return {
      needsOnboarding: !user.onboardingCompleted,
      isNewUser: false,
      onboardingStarted: user.onboardingStarted,
    };
  },
});

// ============ ONBOARDING MANAGEMENT ============

/**
 * Start onboarding process
 */
export const startOnboarding = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Update user onboarding started timestamp
    await ctx.db.patch(user._id, {
      onboardingStarted: Date.now(),
      updatedAt: Date.now(),
    });

    // Create or get onboarding responses record
    const existingResponse = await ctx.db
      .query("onboardingResponses")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    if (existingResponse) {
      return existingResponse;
    }

    const responseId = await ctx.db.insert("onboardingResponses", {
      userId: user._id,
      clerkUserId: args.clerkUserId,
      currentStep: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(responseId);
  },
});

/**
 * Get onboarding progress
 */
export const getOnboardingProgress = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("onboardingResponses")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();
  },
});

/**
 * Update onboarding step 1 - Mood Snapshot
 */
export const updateMoodSnapshot = mutation({
  args: {
    clerkUserId: v.string(),
    moodScore: v.number(), // 1-4 based on emoji selection
  },
  handler: async (ctx, args) => {
    const response = await ctx.db
      .query("onboardingResponses")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    if (!response) {
      throw new Error("Onboarding not started");
    }

    await ctx.db.patch(response._id, {
      onboardingMoodScore: args.moodScore,
      currentStep: Math.max(response.currentStep, 1),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(response._id);
  },
});

/**
 * Update onboarding step 2 - Lifestyle & Stress Check
 */
export const updateLifestyleCheck = mutation({
  args: {
    clerkUserId: v.string(),
    sleepQuality: v.number(),
    energyLevel: v.number(),
    stressLevel: v.number(),
    socialConnection: v.number(),
  },
  handler: async (ctx, args) => {
    const response = await ctx.db
      .query("onboardingResponses")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    if (!response) {
      throw new Error("Onboarding not started");
    }

    await ctx.db.patch(response._id, {
      baselineLifestyle: {
        sleepQuality: args.sleepQuality,
        energyLevel: args.energyLevel,
        stressLevel: args.stressLevel,
        socialConnection: args.socialConnection,
      },
      currentStep: Math.max(response.currentStep, 2),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(response._id);
  },
});

/**
 * Update onboarding step 3 - Mental Health Self-Report
 */
export const updateMentalHealthAssessment = mutation({
  args: {
    clerkUserId: v.string(),
    anxietyFrequency: v.union(
      v.literal("never"),
      v.literal("several_days"),
      v.literal("more_than_half_days"),
      v.literal("nearly_every_day")
    ),
    interestLossFrequency: v.union(
      v.literal("never"),
      v.literal("several_days"),
      v.literal("more_than_half_days"),
      v.literal("nearly_every_day")
    ),
  },
  handler: async (ctx, args) => {
    const response = await ctx.db
      .query("onboardingResponses")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    if (!response) {
      throw new Error("Onboarding not started");
    }

    await ctx.db.patch(response._id, {
      baselineAssessment: {
        anxietyFrequency: args.anxietyFrequency,
        interestLossFrequency: args.interestLossFrequency,
      },
      currentStep: Math.max(response.currentStep, 3),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(response._id);
  },
});

/**
 * Update onboarding step 4 - AI Reflection
 */
export const updateAIReflection = mutation({
  args: {
    clerkUserId: v.string(),
    personalizedGreeting: v.string(),
    strengthHighlight: v.string(),
    dailySuggestion: v.string(),
    fullResponse: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await ctx.db
      .query("onboardingResponses")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    if (!response) {
      throw new Error("Onboarding not started");
    }

    await ctx.db.patch(response._id, {
      aiReflection: {
        personalizedGreeting: args.personalizedGreeting,
        strengthHighlight: args.strengthHighlight,
        dailySuggestion: args.dailySuggestion,
        fullResponse: args.fullResponse,
      },
      currentStep: Math.max(response.currentStep, 4),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(response._id);
  },
});

/**
 * Update onboarding step 5 - Goals & Preferences
 */
export const updateGoalsAndPreferences = mutation({
  args: {
    clerkUserId: v.string(),
    focusAreas: v.array(
      v.union(
        v.literal("reduce_stress"),
        v.literal("improve_sleep"),
        v.literal("boost_energy"),
        v.literal("build_healthy_habits")
      )
    ),
  },
  handler: async (ctx, args) => {
    const response = await ctx.db
      .query("onboardingResponses")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    if (!response) {
      throw new Error("Onboarding not started");
    }

    await ctx.db.patch(response._id, {
      focusAreas: args.focusAreas,
      currentStep: Math.max(response.currentStep, 5),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(response._id);
  },
});

/**
 * Complete onboarding process
 */
export const completeOnboarding = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const response = await ctx.db
      .query("onboardingResponses")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    if (!response) {
      throw new Error("Onboarding not started");
    }

    const now = Date.now();

    // Mark user as onboarded
    await ctx.db.patch(user._id, {
      onboardingCompleted: true,
      onboardingCompletedAt: now,
      updatedAt: now,
    });

    // Mark onboarding response as completed
    await ctx.db.patch(response._id, {
      currentStep: 6,
      completedAt: now,
      updatedAt: now,
    });

    // Add first achievement
    const streakRecord = await ctx.db
      .query("userStreaks")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    if (streakRecord) {
      await ctx.db.patch(streakRecord._id, {
        achievements: [
          {
            type: "onboarding_complete",
            unlockedAt: now,
            title: "Welcome Aboard!",
            description: "You've completed your onboarding journey",
          },
        ],
        updatedAt: now,
      });
    }

    return {
      user: await ctx.db.get(user._id),
      onboardingResponse: await ctx.db.get(response._id),
    };
  },
});

// ============ UTILITY FUNCTIONS ============

/**
 * Get all onboarding data for AI processing
 */
export const getOnboardingDataForAI = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const response = await ctx.db
      .query("onboardingResponses")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    if (!response) {
      return null;
    }

    return {
      moodScore: response.onboardingMoodScore,
      lifestyle: response.baselineLifestyle,
      assessment: response.baselineAssessment,
      currentStep: response.currentStep,
    };
  },
});

/**
 * Get user dashboard data
 */
export const getUserDashboardData = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    if (!user) {
      return null;
    }

    const streakData = await ctx.db
      .query("userStreaks")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    const onboardingData = await ctx.db
      .query("onboardingResponses")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();

    return {
      user,
      streakData,
      onboardingData,
      needsOnboarding: !user.onboardingCompleted,
    };
  },
});
