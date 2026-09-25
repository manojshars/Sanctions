# Deployment

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL 14+ (Supabase, Neon, RDS, Cloud SQL…). Use a pooled URL on serverless. |
| `AUTH_SECRET` | ✅ | 32+ random chars (`openssl rand -base64 48`). The app refuses to run without it in production. |
| `APP_URL` | ✅ | Public base URL (emails, certificates, sitemap). |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | for payments | Without them, production checkout is **disabled** (dev mode simulates payments only when `NODE_ENV≠production`). Webhook: `POST /api/stripe/webhook` with events `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`. Optionally set Stripe price IDs per plan in Admin → Memberships. |
| `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM` | for email | Default `log` records emails in `EmailLog` only. `resend` sends via Resend. |
| `STORAGE_DRIVER` | – | `local` writes to `./storage`. On ephemeral/multi-instance hosts implement S3/Supabase Storage in `src/lib/storage.ts` (same `putObject`/`getObject` interface). |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_DEMO_USERS` | seed | Set `SEED_DEMO_USERS=false` in production. |
| `RATE_LIMIT_MULTIPLIER` | – | Keep `1` in production. |

## Steps

```bash
npm ci
npx prisma migrate deploy
npm run db:seed          # first deploy only (idempotent)
npm run build
npm start                # or deploy to Vercel / a Node host / container
```

- **Vercel:** set env vars, build command `npm run build`, run `prisma migrate deploy` in CI or a release step. Configure external file storage and a shared rate limiter (Redis/Upstash).
- **Container/VM:** `next start` behind a reverse proxy with TLS; persist `./storage` or use object storage.
- Security headers are set in `next.config.ts`; add a CSP at the edge if desired (YouTube embeds use `youtube-nocookie.com`, thumbnails `i.ytimg.com`).
- Analytics: none bundled. If added, load only after the `fca_consent=all` cookie is set.

## Post-deploy checklist
1. Change the seeded admin password; confirm demo users are absent.
2. Add verified videos via Admin → Videos (oEmbed check requires outbound access to youtube.com).
3. Review template Privacy Policy and Terms with counsel; fill in legal entity details.
4. Verify regulatory reference links (see STATUS.md) and set Stripe price IDs.
