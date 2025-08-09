"use client";

import { Block, PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCallback } from "react";

interface JournalEditorClientProps {
  onChange?: (blocks: Block[]) => void;
  initialContent?: PartialBlock[];
  editable?: boolean;
}

export default function JournalEditorClient({
  onChange,
  initialContent,
  editable = true,
}: JournalEditorClientProps) {
  // Initialize the editor with custom configuration
  const editor = useCreateBlockNote({
    initialContent: initialContent || [
      {
        type: "paragraph",
        content: "",
      },
    ],
    placeholders: {
      default: "Start writing your thoughts... Type '/' for commands",
      heading: "Heading",
      bulletListItem: "• List item",
      numberedListItem: "1. List item",
    },
    uploadFile: async (file: File) => {
      // TODO: Implement file upload logic
      // For now, return a placeholder URL
      return `https://via.placeholder.com/400x300?text=${encodeURIComponent(file.name)}`;
    },
  });

  // Handle content changes
  const handleChange = useCallback(() => {
    if (onChange) {
      const blocks = editor.document;
      onChange(blocks);
    }
  }, [editor, onChange]);

  return (
    <div className="journal-editor-wrapper h-full w-full">
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme="dark"
        className="journal-editor-content"
      />
    </div>
  );
}
