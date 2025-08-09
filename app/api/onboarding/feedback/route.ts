import { NextResponse } from "next/server";
import { onboardingAIfeedback } from "@/app/actions/onboarding-feedback";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await onboardingAIfeedback(body);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error("/api/onboarding/feedback error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate AI feedback" },
      { status: 500 }
    );
  }
}
