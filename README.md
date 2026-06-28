# EiWish

A wishlist app: create unlimited wishlists, keep them private, share them
with specific people, or publish them on a public profile page. Built with
Next.js, Supabase, and Tailwind/ShadCN UI.

---

## 1. What you need before you start

- **Node.js 18+** installed locally ([nodejs.org](https://nodejs.org))
- A **Supabase** account — free tier is enough ([supabase.com](https://supabase.com))
- *(Optional)* A **Resend** account if you want custom transactional
  emails later ([resend.com](https://resend.com)). Not required — Supabase
  Auth sends signup confirmation and password reset emails out of the box.
- *(Later, when you're ready to deploy)* A **Vercel** account
  ([vercel.com](https://vercel.com))

---

## 2. Create your Supabase project

1. Go to [supabase.com](https://supabase.com), sign in, and click **New
   project**.
2. Pick an organization, name the project (e.g. `eiwish`), set a strong
   database password (save it somewhere safe), and choose a region close
   to your users.
3. On the project-creation screen, under **Security**:
   - **Enable Data API**: leave checked (default)
   - **Automatically expose new tables**: leave **unchecked**
   - **Enable automatic RLS**: turn **on**
4. Click **Create new project** and wait for it to finish provisioning
   (1–2 minutes).
5. Once ready, go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key
   - **service_role** key (click "reveal" — keep this one secret)

---

## 3. Set up the database schema

In the Supabase dashboard, open the **SQL Editor** and run the three
migration files in `supabase/migrations/` **in order**, each as its own
query:

1. `0001_initial_schema.sql` — creates the `profiles`, `wishlists`,
   `wishlist_collaborators`, and `wishlist_items` tables, plus a trigger
   that auto-creates a profile when someone signs up.
2. `0002_row_level_security.sql` — locks every table down with Row Level
   Security policies. **Don't skip this** — without it, the schema alone
   would let any authenticated user read/write everyone's data.
3. `0003_storage.sql` — creates the `avatars` and `item-images` storage
   buckets and their access policies.

Copy each file's contents into the SQL Editor and click **Run**. You
should see "Success. No rows returned" each time.

> If you're comfortable with the Supabase CLI instead, you can run
> `supabase db push` from the project root once you've linked your
> project — the files in `supabase/migrations/` follow the CLI's naming
> convention.

### Configure email confirmation (recommended)

By default, Supabase requires email confirmation before login. To use the
app's confirmation flow:

1. Go to **Authentication → URL Configuration**.
2. Set **Site URL** to `http://localhost:3000` for local development
   (you'll change this to your real domain after deploying).
3. Add `http://localhost:3000/auth/callback` to **Redirect URLs**.

---

## 4. Configure environment variables

In the project root, copy the example file:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Leave `RESEND_API_KEY` blank unless you've set up Resend — the app works
fully without it.

**Never commit `.env.local`.** It's already covered by `.gitignore`.

---

## 5. Run it locally

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). Sign up for an
account — check your email (including spam) for the confirmation link
from Supabase.

---

## 6. Deploying to Vercel

1. Push this project to a GitHub repository.
2. In Vercel, click **Add New → Project** and import the repo.
3. Add the same environment variables from `.env.local` in Vercel's
   **Settings → Environment Variables** — set `NEXT_PUBLIC_SITE_URL` to
   your real production URL (e.g. `https://eiwish.vercel.app`).
4. Deploy.
5. Back in Supabase **Authentication → URL Configuration**, update **Site
   URL** and **Redirect URLs** to your production domain (you can keep
   the localhost one too, for continued local development).

---

## How the app is organized

```
app/                      Pages and routes (Next.js App Router)
  page.tsx                 Landing page
  login/, signup/, ...      Auth pages
  dashboard/                Signed-in user's wishlist list
  wishlists/[id]/            A single wishlist (items, sharing, settings)
  u/[username]/               Public profile page
  account/                  Profile settings
  auth/callback/             Handles Supabase email confirmation links

components/                UI building blocks
  ui/                        Base components (button, input, dialog, ...)
  auth/, wishlist/, account/, site/   Feature-specific components

lib/
  supabase/                  client.ts (browser), server.ts (Server
                              Components/Actions), admin.ts (service role,
                              server-only), middleware.ts (session refresh)
  actions/                   Server Actions — all writes go through here
  validations/                Zod schemas for every form
  uploads.ts                 Client-side image upload helper
  email.ts                   Optional Resend wrapper
  rate-limit.ts               Simple in-memory rate limiter for auth routes

supabase/migrations/        SQL — schema, RLS policies, storage setup

types/database.ts           Hand-written TypeScript types matching the
                             schema (kept in sync manually; regenerate
                             with `supabase gen types` if you prefer)
```

## Security notes

- **Row Level Security is the real access-control layer**, not the
  application code. Every table is locked down by default; the policies
  in `0002_row_level_security.sql` are the single source of truth for who
  can read/write what. Server Actions add input validation and
  belt-and-suspenders checks, but a bug in application code can't expose
  another user's private data — the database itself refuses the query.
- The **service role key** (`SUPABASE_SERVICE_ROLE_KEY`) bypasses RLS
  entirely and is only ever used server-side (`lib/supabase/admin.ts`,
  marked `server-only`), for the narrow case of checking username
  availability at signup.
- All form inputs are validated with **Zod** before touching the
  database (`lib/validations/`).
- Storage uploads are restricted to the uploading user's own folder via
  storage policies, and validated client-side for file type/size before
  upload.
- Auth actions (login, signup, password reset) are rate-limited per IP.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, etc.)
  are set in `next.config.ts`.

## Extending it

- **Custom emails**: set `RESEND_API_KEY` and call
  `sendCollaboratorInviteEmail` from `lib/email.ts` inside
  `lib/actions/collaborators.ts` after a successful invite.
- **Regenerate types from the live schema** instead of hand-editing
  `types/database.ts`:
  ```bash
  npx supabase gen types typescript --project-id your-project-ref > types/database.ts
  ```
  (You'll want to re-add the `Visibility`/`CollaboratorRole` convenience
  exports at the top if you do this.)
