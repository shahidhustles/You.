import React from "react";
import type { Metadata } from "next";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { DiarySidebar } from "@/components/diary/diary-sidebar";

export const metadata: Metadata = {
  title: {
    template: "%s | Journal",
    default: "Journal",
  },
  description:
    "Express yourself freely with You. - your personal journaling space to capture thoughts, emotions, and insights with rich text editing and AI-powered prompts.",
};

export default function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DiarySidebar />
      <SidebarInset className="bg-black text-zinc-100">
        <div className="flex flex-1 flex-col p-8">
          <div className="mb-6 flex items-center gap-2 md:hidden">
            <SidebarTrigger />
            <span className="text-sm font-medium">Menu</span>
          </div>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
