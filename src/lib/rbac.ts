export type Role = "LEARNER" | "EDITOR" | "SUPPORT" | "ADMIN";

export const PERMISSIONS = {
  "admin:access": ["EDITOR", "SUPPORT", "ADMIN"],
  "content:manage": ["EDITOR", "ADMIN"],
  "content:publish": ["EDITOR", "ADMIN"],
  "questions:review": ["EDITOR", "ADMIN"],
  "support:manage": ["SUPPORT", "ADMIN"],
  "users:manage": ["ADMIN"],
  "memberships:manage": ["ADMIN"],
  "packages:manage": ["ADMIN"],
  "analytics:view": ["ADMIN", "EDITOR", "SUPPORT"],
  "revenue:view": ["ADMIN"],
  "audit:view": ["ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export function isStaff(role: Role | null | undefined): boolean {
  return can(role, "admin:access");
}

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function assertCan(role: Role | null | undefined, permission: Permission): void {
  if (!can(role, permission)) throw new AuthorizationError();
}
