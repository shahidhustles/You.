import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meditation Session",
  description:
    "Find your center with You. - immersive meditation sessions with ambient soundscapes to help you achieve deeper mindfulness and inner peace.",
};

export default function MeditationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
