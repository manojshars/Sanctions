"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireActionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { canAccessTopicContent, getEntitlements, hasFeature } from "@/lib/entitlements";

const schema = z.object({ watched: z.boolean().optional(), inPlan: z.boolean().optional(), notes: z.string().max(5000).optional() });

export async function updateVideoProgressAction(videoId: string, input: z.infer<typeof schema>) {
  const user = await requireActionUser();
  const data = schema.parse(input);
  const video = await db.videoResource.findFirst({ where: { id: videoId, status: "PUBLISHED" }, include: { topic: true } });
  if (!video) return { ok: false, error: "Video not found" };
  const ent = await getEntitlements(user);
  if (video.accessTier === "PREMIUM" && !(hasFeature(ent, "PREMIUM_VIDEOS") || canAccessTopicContent(ent, { accessTier: "PREMIUM", topicSlug: video.topic.slug }))) return { ok: false, error: "Premium video" };
  const update = {
    ...(data.watched !== undefined ? { watchedAt: data.watched ? new Date() : null } : {}),
    ...(data.inPlan !== undefined ? { inPlan: data.inPlan } : {}),
    ...(data.notes !== undefined ? { notes: data.notes } : {}),
  };
  await db.videoProgress.upsert({ where: { userId_videoId: { userId: user.id, videoId } }, update, create: { userId: user.id, videoId, ...update } });
  revalidatePath(`/videos/${videoId}`);
  return { ok: true };
}
