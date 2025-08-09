import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Today",
  description:
    "Start your day mindfully with You. - check your daily mood, practice gratitude, and set intentions for a meaningful day ahead.",
};

export default function TodayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
