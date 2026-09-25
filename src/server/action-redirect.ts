import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ActionState } from "./action-types";

/**
 * Navigates after a successful server action.
 * - JS clients (request carries the `Next-Action` header): return the destination and let the client
 *   navigate. This avoids a race where a redirect from an action replayed during hydration is dropped.
 * - No-JS (progressively enhanced) submissions: issue a normal server redirect.
 */
export async function redirectOrReturn(url: string): Promise<ActionState> {
  const h = await headers();
  if (h.get("next-action")) return { ok: true, redirectTo: url };
  redirect(url);
}
