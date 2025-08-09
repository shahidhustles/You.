"use server";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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

interface OnboardingData {
  moodScore: number; // 1-4
  lifestyle: {
    sleepQuality: number; // 1-10
    energyLevel: number; // 1-10
    stressLevel: number; // 1-10
    socialConnection: number; // 1-10
  };
  assessment: {
    anxietyFrequency: Frequency;
    interestLossFrequency: Frequency;
  };
  focusAreas: FocusArea[];
}

const AIFeedbackSchema = z.object({
  personalizedGreeting: z
    .string()
    .describe(
      "A warm, empathetic greeting that acknowledges the user's current state"
    ),
  strengthHighlight: z
    .string()
    .describe(
      "A positive observation about the user's resilience or strengths"
    ),
  dailySuggestion: z
    .string()
    .describe(
      "A specific, actionable suggestion for today that relates to the actionType"
    ),
  fullResponse: z
    .string()
    .describe(
      "A comprehensive, supportive message that ties everything together"
    ),
  actionType: z
    .enum([
      "meditation",
      "journaling",
      "breathing",
      "movement",
      "reflection",
      "mindfulness",
    ])
    .describe("The type of action recommended based on their needs"),
});

export const onboardingAIfeedback = async (data: OnboardingData) => {
  try {
    const { object } = await generateObject({
      model: google("gemini-1.5-flash"),
      schema: AIFeedbackSchema,
      system: `You are a compassionate wellness coach analyzing a user's onboarding responses to provide personalized mental health support.

      ANALYSIS GUIDELINES:
      - Mood Score: 1=Low, 2=Okay, 3=Good, 4=Great
      - Lifestyle scores: 1-10 scale (higher = better for sleep, energy, social; higher = worse for stress)
      - Anxiety/Interest Loss: never < several_days < more_than_half_days < nearly_every_day
      - Focus areas indicate user priorities
      
      RESPONSE TONE:
      - Warm, empathetic, and non-judgmental
      - Acknowledge their feelings without dismissing them
      - Highlight strengths and resilience
      - Provide hope and actionable guidance
      
      ACTION TYPE SELECTION:
      - meditation: For high stress, anxiety issues
      - journaling: For processing emotions, low interest in activities
      - breathing: For immediate anxiety relief, stress management
      - movement: For low energy, mood improvement
      - reflection: For self-awareness, understanding patterns
      - mindfulness: For present-moment awareness, general wellness
      
      DAILY SUGGESTION GUIDELINES:
      - Must be specific and actionable (include duration/method)
      - Should align with the selected actionType
      - Keep it simple and achievable

      - Examples: "Try 5 minutes of deep breathing", "Write down 3 things you're grateful for", 
      "Take a 10-minute walk outside"
      (note do not recommend apps or other things to user just the actionable step. )`,
      prompt: `Analyze this user's onboarding data and provide personalized wellness feedback:

      MOOD: ${data.moodScore}/4 (${data.moodScore === 1 ? "Low" : data.moodScore === 2 ? "Okay" : data.moodScore === 3 ? "Good" : "Great"})
      
      LIFESTYLE:
      - Sleep Quality: ${data.lifestyle.sleepQuality}/10
      - Energy Level: ${data.lifestyle.energyLevel}/10  
      - Stress Level: ${data.lifestyle.stressLevel}/10
      - Social Connection: ${data.lifestyle.socialConnection}/10
      
      MENTAL HEALTH:
      - Anxiety Frequency: ${data.assessment.anxietyFrequency}
      - Interest Loss Frequency: ${data.assessment.interestLossFrequency}
      
      FOCUS AREAS: ${data.focusAreas.join(", ") || "None selected"}
      
      Provide encouraging, personalized feedback with a specific actionable suggestion.`,
    });

    return {
      success: true,
      data: object,
    };
  } catch (error) {
    console.error("Error generating AI feedback:", error);
    return {
      success: false,
      error: "Failed to generate AI feedback",
    };
  }
};
