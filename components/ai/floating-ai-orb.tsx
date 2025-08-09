"use client";
import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Mic, MicOff, X } from "lucide-react";
import { Orb } from "react-ai-orb";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Vapi from "@vapi-ai/web";

export interface FloatingAIOrbProps {
  size?: number;
  className?: string;
}

// Type definitions for Vapi events
interface CallStartSuccessEvent {
  totalDuration: number;
  callId?: string;
  timestamp: string;
}

interface VapiMessage {
  type?: string;
  call?: {
    id: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Floating AI Orb pinned to bottom-right.
 * Usage: render inside any layout/page; it will stay fixed.
 */
const FloatingAIOrb: React.FC<FloatingAIOrbProps> = ({
  size = 0.6,
  className,
}) => {
  const [micOn, setMicOn] = React.useState(true);
  const [journalMode, setJournalMode] = React.useState(false);
  const [isCallActive, setIsCallActive] = React.useState(false);
  const [vapi, setVapi] = React.useState<Vapi | null>(null);
  const [sessionId, setSessionId] = React.useState<string | null>(null);

  // Initialize Vapi when component mounts
  React.useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      console.error("VAPI public key not found in environment variables");
      return;
    }

    const vapiInstance = new Vapi(publicKey);
    setVapi(vapiInstance);

    // Event listeners
    vapiInstance.on("call-start", () => {
      console.log("Call has started.");
      setIsCallActive(true);
    });

    vapiInstance.on("call-end", () => {
      console.log("Call has ended.");
      setIsCallActive(false);
      setMicOn(true); // Reset mic state
      // Keep session ID for potential journal saving after call ends
    });

    // Listen for call-start-success event to get the real call ID
    vapiInstance.on("call-start-success", (event: CallStartSuccessEvent) => {
      console.log("Call started successfully:", event);
      if (event.callId) {
        console.log("Real session/call ID:", event.callId);
        setSessionId(event.callId);
      }
    });

    // Listen for messages that might contain call information
    vapiInstance.on("message", (message: VapiMessage) => {
      console.log("Message received:", message);
      // Some message types might contain call-related information
      if (message.call?.id) {
        console.log("Call ID from message:", message.call.id);
        setSessionId(message.call.id);
      }
    });

    vapiInstance.on("speech-start", () => {
      console.log("Speech started");
    });

    vapiInstance.on("speech-end", () => {
      console.log("Speech ended");
    });

    vapiInstance.on("error", (error: Error) => {
      console.error("Vapi error:", error);
    });

    return () => {
      // Cleanup
      if (vapiInstance) {
        vapiInstance.stop();
      }
    };
  }, []);

  // Start call when dialog opens
  const handleStartCall = async () => {
    if (vapi && !isCallActive) {
      try {
        const assistantId =
          process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ||
          "c0e7356b-ec0a-481a-ad02-f7d1841b4bc5";

        // The start method returns a Call object with an ID
        const call = await vapi.start(assistantId);
        if (call?.id) {
          console.log("Real session ID from start method:", call.id);
          setSessionId(call.id);
        }
      } catch (error) {
        console.error("Failed to start call:", error);
      }
    }
  };

  // End call
  const handleEndCall = () => {
    if (vapi && isCallActive) {
      vapi.stop();
    }
  };

  // Toggle mute
  const handleToggleMute = () => {
    if (vapi && isCallActive) {
      if (micOn) {
        vapi.setMuted(true);
      } else {
        vapi.setMuted(false);
      }
      setMicOn(!micOn);
    }
  };

  // Save session when journal mode is enabled and we have a session
  React.useEffect(() => {
    if (journalMode && sessionId && isCallActive) {
      console.log("Saving session for journal:", sessionId);
      // TODO: Implement saving session to your backend/database
      // For now, we'll just log it
    }
  }, [journalMode, sessionId, isCallActive]);

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          aria-label="Open AI Orb"
          className={`fixed bottom-4 right-4 z-50 rounded-full focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none ${className ?? ""}`}
          onClick={handleStartCall}
        >
          <Orb size={size} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Transparent overlay with background blur to de-emphasize page */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md" />

        {/* Centered content */}
        <Dialog.Content className="fixed inset-0 z-[60] grid place-items-center p-6 outline-none">
          {/* A11y: Hidden title/description to satisfy Radix requirements */}
          <VisuallyHidden>
            <Dialog.Title>AI Voice Assistant</Dialog.Title>
            <Dialog.Description>
              Speak with your assistant or create a journal from this session.
            </Dialog.Description>
          </VisuallyHidden>
          {/* Transparent center with larger orb and controls */}
          <div className="flex flex-col items-center gap-7 p-2">
            <div className="flex flex-col items-center gap-2">
              <Orb size={3} />
              {/* Call status indicator */}
              <div className="text-white text-sm font-medium">
                {isCallActive ? "🟢 Connected" : "⚪ Connecting..."}
              </div>
              {/* Session ID display */}
              {sessionId && (
                <div className="text-white text-xs opacity-75">
                  Session: {sessionId.slice(0, 8)}...
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Mic toggle - larger button */}
              <Button
                variant={micOn ? "default" : "secondary"}
                aria-pressed={micOn}
                aria-label={
                  micOn ? "Turn microphone off" : "Turn microphone on"
                }
                onClick={handleToggleMute}
                disabled={!isCallActive}
                className="h-20 w-20 rounded-full p-0"
              >
                {micOn ? (
                  <Mic className="size-11" />
                ) : (
                  <MicOff className="size-11" />
                )}
              </Button>

              <Dialog.Close asChild>
                {/* Close - larger button */}
                <Button
                  className="h-20 w-20 rounded-full p-0 ml-10"
                  variant="ghost"
                  aria-label="End Call"
                  onClick={handleEndCall}
                >
                  <X className="size-11" />
                </Button>
              </Dialog.Close>
            </div>
            {/* Journal mode toggle with label */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={journalMode}
                aria-label="Toggle journal mode"
                onClick={() => setJournalMode((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 ${
                  journalMode ? "bg-indigo-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    journalMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-white">
                Make it a journal entry
              </span>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default FloatingAIOrb;
