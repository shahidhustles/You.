import type { Metadata } from "next";
import HeroSection from "@/components/hero-section";
import LogoCloud from "@/components/logo-cloud";
import Features from "@/components/features-12";
import IntegrationsSection from "@/components/integrations-8";

export const metadata: Metadata = {
  title: "You. - Your AI Mental Health Companion",
  description:
    "Transform your mental wellness journey with You. - an AI-powered companion featuring voice therapy, mindful journaling, meditation guidance, and personalized breathing exercises. Start your path to better mental health today.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <LogoCloud />
      <Features />
      <IntegrationsSection />
    </div>
  );
}
