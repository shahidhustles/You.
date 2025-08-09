import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Find and rediscover your thoughts with You. - search through your journal entries, meditation sessions, and wellness activities to uncover patterns and insights.",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
