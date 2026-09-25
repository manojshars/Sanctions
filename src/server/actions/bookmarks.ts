"use server";
import { requireActionUser } from "@/lib/auth/session";
import { toggleBookmark } from "@/server/services/bookmarks";

export async function toggleBookmarkAction(entityType: string, entityId: string, kind: "SAVE" | "FLAG" = "SAVE") {
  const user = await requireActionUser();
  const saved = await toggleBookmark(user.id, entityType, entityId, kind === "FLAG" ? "FLAG" : "SAVE");
  return { saved };
}
