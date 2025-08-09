"use client";

import { Block, PartialBlock } from "@blocknote/core";
import dynamic from "next/dynamic";

// Dynamic import to ensure BlockNote only loads on client-side
const JournalEditorClient = dynamic(() => import("./journal-editor-client"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-muted-foreground">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        Loading editor...
      </div>
    </div>
  ),
});

interface JournalEditorProps {
  onChange?: (blocks: Block[]) => void;
  initialContent?: PartialBlock[];
  editable?: boolean;
}

export default function JournalEditor(props: JournalEditorProps) {
  return <JournalEditorClient {...props} />;
}
