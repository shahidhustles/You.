import React from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { DiarySidebar } from "@/components/diary/diary-sidebar";
import FloatingAIOrb from "@/components/ai/floating-ai-orb";

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
