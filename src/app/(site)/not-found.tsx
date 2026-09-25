import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <Compass className="h-12 w-12 text-accent" />
      <h1 className="mt-4 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-muted">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
      <div className="mt-6 flex gap-3"><ButtonLink href="/">Home</ButtonLink><ButtonLink href="/search" variant="secondary">Search</ButtonLink></div>
    </div>
  );
}
