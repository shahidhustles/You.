import React from "react";
import type { Metadata } from "next";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { DiarySidebar } from "@/components/diary/diary-sidebar";
import FloatingAIOrb from "@/components/ai/floating-ai-orb";

export const metadata: Metadata = {
  title: {
    template: "%s | Diary",
    default: "Diary",
  },
  description:
    "Your personal diary space in You. - track your daily journey, explore mindful moments, and discover insights through journaling, meditation, and breathing exercises.",
};

export default function DiaryLayout({
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
        {/* Floating AI Orb, always bottom-right */}
        <FloatingAIOrb />
      </SidebarInset>
    </SidebarProvider>
  );
}
