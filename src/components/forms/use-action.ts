"use client";
import { useActionState } from "react";
import type { ActionState } from "@/server/action-types";

export function useFormAction(action: (s: ActionState, f: FormData) => Promise<ActionState>) {
  return useActionState(action, {} as ActionState);
}
