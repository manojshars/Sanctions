import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { isStaff } from "@/lib/rbac";
import { SiteHeader } from "./site-header";

export async function HeaderServer() {
  const user = await getCurrentUser();
  let unread = 0;
  let isOrgManager = false;
  if (user) {
    [unread, isOrgManager] = await Promise.all([
      db.notification.count({ where: { userId: user.id, readAt: null } }),
      db.organizationMember.count({ where: { userId: user.id, role: "MANAGER" } }).then((c) => c > 0),
    ]);
  }
  return (
    <SiteHeader
      unread={unread}
      user={user ? { name: user.name, email: user.email, isStaff: isStaff(user.role), isOrgManager } : null}
    />
  );
}
