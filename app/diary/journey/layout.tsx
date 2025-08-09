import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Journey",
  description:
    "Explore your personal growth journey with You. - view your progress, reflect on past entries, and celebrate milestones in your wellness path.",
};

export default function JourneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
