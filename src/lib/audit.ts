import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function audit(
  actorId: string | null,
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata?: Prisma.InputJsonValue,
  ip?: string | null,
) {
  await db.auditLog.create({
    data: { actorId, action, entityType, entityId: entityId ?? null, metadata, ip: ip ?? null },
  });
}
