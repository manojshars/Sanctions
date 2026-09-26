"use client";

/** Destructive action button that asks for confirmation before submitting. */
export function ConfirmButton({ action, label, confirm }: { action: () => Promise<void>; label: string; confirm: string }) {
  return (
    <form action={action} onSubmit={(e) => { if (!window.confirm(confirm)) e.preventDefault(); }}>
      <button type="submit" className="inline-flex h-9 items-center rounded-lg border border-danger/40 px-3 text-sm font-medium text-danger hover:bg-danger/10">{label}</button>
    </form>
  );
}
