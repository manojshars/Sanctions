"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Stores consent in a first-party cookie. Only strictly-necessary cookies are set without consent. */
export function CookieConsent() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(!document.cookie.split("; ").some((c) => c.startsWith("fca_consent=")));
  }, []);
  function choose(value: "all" | "necessary") {
    document.cookie = `fca_consent=${value}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
    setShow(false);
  }
  if (!show) return null;
  return (
    <div role="region" aria-label="Cookie consent" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-lift sm:inset-x-6">
      <p className="text-sm text-ink">
        We use strictly necessary cookies to keep you signed in and remember preferences. With your permission we also use privacy-conscious,
        aggregate analytics. No advertising trackers. <Link href="/privacy#cookies" className="text-brand underline">Learn more</Link>.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => choose("all")}>Accept analytics</Button>
        <Button size="sm" variant="secondary" onClick={() => choose("necessary")}>Necessary only</Button>
      </div>
    </div>
  );
}
