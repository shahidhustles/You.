export type SpaceItem = {
  key: string;
  title: string;
  description?: string;
};

// Core spaces used throughout the app (excludes breathing and meditation)
export const BASE_SPACES: SpaceItem[] = [
  {
    key: "daily",
    title: "Daily Check-In",
    description: "Pen to page reflections.",
  },
  {
    key: "gratitude",
    title: "Gratitude",
    description: "Capture today's thanks.",
  },
  {
    key: "mood",
    title: "Mood Log",
    description: "Track how you feel.",
  },
  {
    key: "goals",
    title: "Goals",
    description: "Set intentions & aims.",
  },
  {
    key: "arts",
    title: "Arts & Crafts",
    description: "",
  },
  {
    key: "memories",
    title: "Memories &\nMilestones",
    description: "Journals for every chapter\nof your life.",
  },
  {
    key: "philosophy",
    title: "Philosophy &\nBig Thoughts",
  },
  {
    key: "connections",
    title: "Connections",
    description: "Write about people who\nshape your life.",
  },
];
