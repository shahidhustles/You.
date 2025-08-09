import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  // In a real implementation, you might fetch journal data to create dynamic titles
  // For now, we'll use a generic title

  return {
    title: `Journal Entry`,
    description:
      "Write, reflect, and grow with You. - capture your thoughts and feelings in this personal journal entry with AI-powered insights and prompts.",
  };
}

export default function JournalEntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
