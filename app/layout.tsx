import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | You.",
    default: "You. - Your Personal Wellness & Mindfulness Companion",
  },
  description:
    "Transform your daily routine with You. - a comprehensive wellness app featuring journaling, meditation, breathing exercises, and mindful living tools to help you cultivate inner peace and personal growth.",
  keywords: [
    "wellness",
    "mindfulness",
    "meditation",
    "journaling",
    "breathing exercises",
    "mental health",
    "self-care",
    "personal growth",
    "diary",
    "gratitude",
  ],
  authors: [{ name: "You." }],
  creator: "You.",
  publisher: "You.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://youapp.com",
    title: "You. - Your Personal Wellness & Mindfulness Companion",
    description:
      "Transform your daily routine with comprehensive wellness tools including journaling, meditation, and breathing exercises.",
    siteName: "You.",
  },
  twitter: {
    card: "summary_large_image",
    title: "You. - Your Personal Wellness & Mindfulness Companion",
    description:
      "Transform your daily routine with comprehensive wellness tools including journaling, meditation, and breathing exercises.",
    creator: "@youapp",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
