import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Space",
  description:
    "Enter your mindful space with You. - choose from meditation sessions, breathing exercises, and wellness activities designed to bring peace and clarity to your day.",
};

export default function SpaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
