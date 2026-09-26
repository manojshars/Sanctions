# Security & privacy

## Authentication
- Passwords: bcrypt (12 rounds); policy ≥10 chars with a letter and a number.
- Sessions: 32-byte random token in an `httpOnly`, `SameSite=Lax`, `Secure` (production) cookie; only
  an HMAC-SHA256 (keyed by `AUTH_SECRET`) of the token is stored, so a DB leak doesn't expose sessions.
  Sessions are revocable; password reset and role changes sign the user out everywhere; suspended
  users are rejected on every request.
- Email verification and password reset use single-use, expiring, hashed tokens. Reset requests don't
  reveal whether an account exists; login runs a bcrypt compare even for unknown emails.
- Rate limits (in-memory, per IP / user): login, registration, password reset, newsletter, inquiries,
  tickets, answer saves, search suggestions, certificate lookups, data export.
  `RATE_LIMIT_MULTIPLIER` scales them (keep `1` in production). For multiple instances, back
  `lib/rate-limit.ts` with Redis.

## Authorization
- Roles: `LEARNER`, `EDITOR`, `SUPPORT`, `ADMIN`; permissions in `src/lib/rbac.ts` (e.g. only ADMIN
  manages users/roles, views revenue and the audit log; SUPPORT manages tickets; EDITOR manages content).
- Checks run in services (`assertCan`) and in pages/actions (`requirePermission`) — never only in the
  UI. Middleware adds a fast signed-out redirect but is not relied upon.
- **Entitlements** (`src/lib/entitlements.ts`) are computed server-side from memberships, packages,
  organisation plans and corporate assignments. Clients cannot set scores, certificates, memberships
  or roles: those are written only by services after server-side validation (payments via idempotent
  fulfilment or verified Stripe webhooks).
- **Answer keys** are never sent before submission: session views are built from an allow-list of
  fields; exam modes reject instant checking; results require a submitted attempt owned by the user.
  Tests assert that no key such as `isCorrect`, `explanation`, `acceptedAnswers` appears.
- **Tenant isolation**: corporate services require the actor to be a MANAGER of the org and only
  operate on members of that org; reports are scoped by `orgId`. Covered by integration tests.
- Admin actions (content, users, memberships, tickets, settings) are written to `AuditLog`.

## Input & content safety
- Zod validation on all inputs; Prisma parameterised queries.
- Markdown is rendered with `marked` and sanitised with DOMPurify.
- Uploads: allow-list (PNG/JPG/PDF/TXT), 5 MB, magic-byte checks, random storage keys, served with
  `Content-Disposition: attachment` + `nosniff`, access-checked (internal notes hidden from requesters).
- Training-material PDFs (staff with `content:manage` only): `.pdf` only, 25 MB, `%PDF-` signature, must
  parse with pdf-lib, and are rejected if they contain `/JavaScript`, `/JS`, `/Launch`, `/EmbeddedFile` or
  `/RichMedia`. Learner downloads re-check publication, enrolment and the downloads entitlement on every
  request; replaced and deleted files are removed from storage; every change is audited.
- CSV exports neutralise formula injection. Security headers set in `next.config.ts`.
- Server Actions include Next.js origin checks (CSRF protection).

## Privacy
- Cookie consent banner; only necessary cookies without consent; no ad trackers.
- Data export (`/account-export`, JSON) and account deletion (erases personal/learning data; payment
  records retained anonymised).
- Private routes are `noindex` and disallowed in robots.txt.

## Optional: Postgres row-level security
Access control is enforced in the application layer, which is the only DB client. If you expose the
database to other clients (e.g. Supabase client libraries), enable RLS with policies such as
`USING (user_id = current_setting('app.user_id'))` on learner-owned tables and org-scoped policies on
corporate tables, and set `app.user_id` per transaction. This is not configured by default.
