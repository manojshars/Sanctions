# Deploying to Vercel

The app is prepared for Vercel:

- `npm run vercel-build` (used automatically by Vercel) generates the Prisma client, applies database
  migrations on **production** deployments, optionally seeds, then builds Next.js.
- Uploaded files (support attachments, training-material PDFs) go to a **private Vercel Blob** store
  whenever `BLOB_READ_WRITE_TOKEN` is present. Vercel's own disk is not persistent.
- Training-material PDFs are uploaded from the browser straight to Blob storage, which avoids Vercel's
  4.5 MB request limit. They are still validated on the server when saved. Support attachments are limited to 4 MB per message.
- If `APP_URL` is not set, links use the project's Vercel production domain.
- The seed refuses to run on a hosted deployment without a strong `SEED_ADMIN_PASSWORD`, and it never
  creates demo accounts there (unless `SEED_DEMO_USERS=true`).

## 1. Choose the branch Vercel deploys

Vercel deploys a repository's **default branch** to production. In this repository the default
branch is currently `claude/funny-sagan-kfh9lj`, which holds a different project. Do one of the following:

- On GitHub, open **Settings → General → Default branch** and switch it to `claude/wizardly-bohr-i2zmf7`
  (or to a `main` branch that contains this code), **or**
- After importing (step 2), set the production branch in Vercel under
  **Project → Settings → Environments → Production → Branch Tracking**.

## 2. Import the project

1. Sign in at vercel.com with your GitHub account.
2. Choose **Add New… → Project**, then import `manojshars/Sanctions`.
3. Vercel detects **Next.js**. Leave the build settings at their defaults, because the `vercel-build` script is used automatically.
4. Under **Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `AUTH_SECRET` | A long random string of 48+ characters. It signs login sessions, so keep it secret. |
   | `SEED_ADMIN_EMAIL` | The email for your administrator account (optional; default `admin@fincrime.academy`). |
   | `SEED_ADMIN_PASSWORD` | A unique password with 12+ characters, including letters and numbers. |
   | `SEED_ON_DEPLOY` | `true` (first deployment only; it loads the courses, questions, flashcards and other content). |

5. Click **Deploy**. The first build is expected to stop with *"DATABASE_URL is not set"*, because no
   database is connected yet.

## 3. Add a database and file storage

In the project, open the **Storage** tab:

1. **Create Database → Neon (Postgres)**. Pick a region close to your users, and connect it to this
   project for all environments. This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
2. **Create → Blob**. If you are asked about access, choose **Private**. Connect the store to this project, which adds
   `BLOB_READ_WRITE_TOKEN`.

Then open **Deployments**, click **⋯** on the failed deployment, and choose **Redeploy**. The build log should show
"Applying database migrations…", then "Seeding sample content…", then the Next.js build.

## 4. After the first successful deployment

1. Open the deployment URL (for example `https://sanctions-xxxx.vercel.app`) and sign in at `/login`
   with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`. The admin portal is at `/admin`.
2. **Delete the `SEED_ON_DEPLOY` variable** (Settings → Environment Variables). If you leave it, every later
   deployment re-applies the sample content and overwrites edits you made to seeded courses. It never touches
   uploaded materials or users.
3. Optionally set `APP_URL` to your custom domain once you add one (Settings → Domains).

## Optional integrations

| Feature | Variables | Without them |
|---|---|---|
| Payments (Stripe) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; webhook URL `https://<domain>/api/stripe/webhook` | Checkout is disabled in production. |
| Email (Resend) | `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM` | Emails are recorded in the database only (verification and reset emails are not delivered). |

## Known limits on Vercel

- **Rate limiting** is kept in memory per server instance. On Vercel it is best-effort; use Upstash Redis for strict limits.
- **Abandoned uploads:** if a PDF is uploaded directly and the form is never saved, the file stays in Blob storage.
  Rejected PDFs are deleted automatically.
- **Preview deployments** do not run migrations. Point them at a separate database branch, or set
  `MIGRATE_ON_BUILD=true` for them.
- **Hobby plan:** Vercel's free plan is for non-commercial use. A commercial launch needs a Pro plan.
