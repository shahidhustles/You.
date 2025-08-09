"use client";

import { ConvexReactClient } from "convex/react";

// Singleton Convex client for the browser
export const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);
