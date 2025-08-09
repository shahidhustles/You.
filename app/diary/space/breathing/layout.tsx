import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Breathing Exercise",
  description:
    "Practice mindful breathing with You. - guided breathing sessions to reduce stress, increase focus, and cultivate inner calm through rhythmic breathing techniques.",
};

export default function BreathingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
