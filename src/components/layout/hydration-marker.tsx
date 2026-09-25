"use client";
import { useEffect } from "react";

/** Sets <html data-hydrated> once React has hydrated (used by tests and hydration-sensitive UI). */
export function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);
  return null;
}
