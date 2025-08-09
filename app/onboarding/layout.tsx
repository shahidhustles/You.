import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started",
  description:
    "Welcome to You. Let's personalize your wellness journey with a quick setup to tailor your experience for meditation, journaling, and mindful living.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
