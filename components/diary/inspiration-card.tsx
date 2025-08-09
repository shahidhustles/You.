"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface InspirationCardProps {
  title: string;
  content: string;
  buttonText: string;
  icon: React.ReactNode;
  redirectTo?: string;
}

export function InspirationCard({
  title,
  content,
  buttonText,
  icon,
  redirectTo = "/diary/space",
}: InspirationCardProps) {
  const router = useRouter();

//Later push to the id of the journal page.
  const handleClick = () => {
    router.push(redirectTo);
  };

  return (
    <div className="group relative rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center backdrop-blur-sm transition-all hover:border-zinc-700">
      <div className="mb-6 flex justify-center">
        <div className="rounded-full bg-zinc-800/50 p-3">{icon}</div>
      </div>

      <h3 className="mb-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">
        {title}
      </h3>

      <p className="mb-6 text-lg font-semibold text-zinc-100 leading-relaxed tracking-tight">
        {content}
      </p>

      <Button
        variant="outline"
        className="rounded-full border-zinc-700 bg-transparent px-6 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
        onClick={handleClick}
      >
        {buttonText}
      </Button>
    </div>
  );
}
