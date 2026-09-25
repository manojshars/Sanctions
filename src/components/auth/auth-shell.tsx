import { LogoMark } from "@/components/layout/logo";

export function AuthShell({ title, description, children, aside }: { title: string; description?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="container grid min-h-[70vh] items-center gap-10 py-12 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <LogoMark className="h-11 w-11" />
        <h1 className="mt-6 text-3xl font-bold">{title}</h1>
        {description && <p className="mt-2 text-muted">{description}</p>}
        <div className="mt-8">{children}</div>
      </div>
      <div className="hidden lg:block">{aside}</div>
    </div>
  );
}

export function AuthAside() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-navy p-10 text-white">
      <div className="grid-bg absolute inset-0" aria-hidden />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">FinCrime Academy</p>
        <p className="mt-4 font-display text-3xl font-bold leading-tight">Master Financial Crime. Strengthen Compliance. Advance Your Career.</p>
        <ul className="mt-8 space-y-3 text-white/75">
          <li>• Courses across AML, sanctions, fraud and ABC</li>
          <li>• Practice questions with detailed explanations</li>
          <li>• Timed mock examinations and readiness diagnostics</li>
          <li>• Spaced-repetition flashcards and case simulations</li>
        </ul>
      </div>
    </div>
  );
}
