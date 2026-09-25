"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ActionState } from "@/server/action-types";

/** Follows `redirectTo` from an action result, with a hard-navigation fallback. */
export function useActionRedirect(state: ActionState) {
  const router = useRouter();
  useEffect(() => {
    const to = state.redirectTo;
    if (!to) return;
    router.push(to);
    const t = setTimeout(() => {
      if (window.location.pathname + window.location.search !== to) window.location.assign(to);
    }, 2500);
    return () => clearTimeout(t);
  }, [state, router]);
}

export function useFormAction(action: (s: ActionState, f: FormData) => Promise<ActionState>) {
  const result = useActionState(action, {} as ActionState);
  useActionRedirect(result[0]);
  return result;
}
