# ⚖️ Pre Legal Document Generator (Simple MVP)

> **Pick a template. Fill a form. Preview. Download.**
> A simple website that helps people prepare draft legal documents (like NDAs, rental agreements, and freelance contracts) by answering a few questions.

> **Legal notice:** This tool helps prepare drafts only. It is **not** legal advice and does not guarantee a document is valid or suitable for your situation. Laws differ by country. Always verify the content and consult a qualified lawyer when needed.

---

## 1. What this project is

A small web app with a **clear, short list of features**. A user can:

1. Browse document templates
2. Fill in a step-by-step form
3. See the document update live in a preview
4. Save it, print it as PDF, or copy the text

That's it. Everything else is intentionally left out so the project stays easy to build and easy for an AI coding tool to get right.

---

## 2. Rules for the AI / developer building this (READ FIRST)

These rules prevent the most common mistakes:

- **Build only what is listed under "MVP Features".** Do not add anything from "Out of Scope".
- **Build one stage at a time** (see Build Order). Make sure each stage runs with no errors before starting the next.
- **Use only the tech stack in section 4.** Do not swap or add libraries unless something truly cannot work without them.
- **Keep files small and simple.** Plain, readable code is better than clever code.
- **Never use `eval()` or run code from templates.** Templates are plain text with `{{placeholders}}` only.
- **Hosting is Vercel and the backend is Supabase.** Use only the official `@supabase/supabase-js` and `@supabase/ssr` packages. Do not use Prisma, SQLite, Auth.js, or a custom server.
- **The Supabase `service_role` key is server-only.** It is used only in the `/api` routes (`lib/server.js`) and must never be in browser code or any `NEXT_PUBLIC_` variable.
- **No payments, no AI features, no teams, no Docker, no Redis, no background jobs.**
- Every page must show the legal notice (a small footer or banner is enough).
- After each stage, run `npm run dev` and confirm the app opens without errors.

---

## 3. MVP Features

### ✅ Core (must have)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Landing page** | Short intro, "Browse Templates" button, legal notice |
| 2 | **Template library** | Cards showing title, category, short description |
| 3 | **Search and category filter** | Search box + category buttons (All, Business, Freelance, Personal, Property) |
| 4 | **Guided form** | Fields come from the template (text, date, number, textarea, dropdown) |
| 5 | **Form validation** | Required fields show a clear error message |
| 6 | **Live preview** | Document text updates as the user types |
| 7 | **Missing-field warning** | Empty fields are highlighted in the preview, e.g. `[Client name]` |
| 8 | **Download as PDF** | Using the browser's Print → Save as PDF with a print-friendly style |
| 9 | **Copy to clipboard** | One button copies the document text |
| 10 | **Disclaimer banner** | Shown on every page and printed at the end of each document |

### ➕ Extra simple features (added to make it feel complete, still easy)

| # | Feature | Description |
|---|---------|-------------|
| 11 | **Autosave draft** | The form saves to the browser (`localStorage`) so nothing is lost on refresh |
| 12 | **My Documents page** | List of saved drafts with Open, Duplicate, and Delete buttons |
| 13 | **Reset form button** | Clears the form after a confirmation message |
| 14 | **Review checklist** | A small checklist before downloading, e.g. "I checked all names, dates, and amounts" |
| 15 | **Download as .txt** | Extra export that needs no library |
| 16 | **Optional sections** | A section appears only if the user fills a certain field (e.g. "Late fee clause") |
| 17 | **Example data button** | "Fill with example" so users can see how the form works |
| 18 | **FAQ / Help page** | A static page with 5–8 common questions |
| 19 | **Responsive design** | Works on phone, tablet, and desktop |

### 🔐 Stage 2 (only after the core works and is deployed): Supabase backend

| # | Feature | Description |
|---|---------|-------------|
| 20 | **Register / Login / Logout** | Email + password using Supabase Auth |
| 21 | **Save documents to the database** | Documents are stored in Supabase and belong to the logged-in user |
| 22 | **Private documents** | Row Level Security makes sure users can only see their own documents |

---

## 4. Tech Stack (keep it simple)

| Part | Technology | Why |
|------|-----------|-----|
| Framework | **Next.js (App Router)** | One project for pages and the optional API |
| Language | **JavaScript or TypeScript** (pick one, stay consistent) | |
| Styling | **Tailwind CSS** | Fast, no custom CSS files to manage |
| Icons | **lucide-react** | Simple icons |
| Templates | **JSON files** in `/templates` | No database needed for templates |
| Saving (Stage 1) | **Browser `localStorage`** | No backend needed |
| Hosting | **Vercel** | Free, easy deploy straight from GitHub |
| Backend / Database (Stage 2) | **Supabase** (hosted PostgreSQL) | No server to manage; works directly from Next.js |
| Login (Stage 2) | **Supabase Auth** (email + password) | Built in, no custom auth code |
| Supabase packages | `@supabase/supabase-js`, `@supabase/ssr` | Official client libraries |
| PDF | **Browser print** (`window.print()` + print CSS) | No library, no errors |

> Not used in this version: Prisma, SQLite, Auth.js, Redis, BullMQ, Stripe, Docker, Playwright, TipTap, OpenAI/AI APIs, S3 storage.

### How the pieces connect

```text
 User's browser
      │
      ▼
 Vercel (hosts the Next.js website)
      │   uses NEXT_PUBLIC_SUPABASE_URL + public key
      ▼
 Supabase (Auth + PostgreSQL "documents" table)
```

---

## 5. Folder Structure

```text
pre-legal-document-generator/
├── app/
│   ├── page.js                  # Landing page
│   ├── templates/
│   │   ├── page.js              # Template library (search + filter)
│   │   └── [id]/page.js         # Form + live preview for one template
│   ├── my-documents/page.js     # Saved drafts
│   ├── help/page.js             # FAQ
│   ├── login/page.js            # Stage 2
│   ├── register/page.js         # Stage 2
│   └── layout.js                # Navbar + footer + disclaimer
├── components/
│   ├── Navbar.js
│   ├── Footer.js
│   ├── TemplateCard.js
│   ├── DynamicForm.js           # Builds the form from template fields
│   ├── DocumentPreview.js       # Shows the filled document
│   └── DisclaimerBanner.js
├── lib/
│   ├── templates.js             # Loads template JSON files
│   ├── renderTemplate.js        # Replaces {{placeholders}} with values
│   ├── storage.js               # localStorage helpers (Stage 1)
│   └── supabase/                # Stage 2 only
│       ├── client.js            # Supabase client for the browser
│       └── server.js            # Supabase client for server code
├── templates/
│   ├── nda.json
│   ├── freelance-contract.json
│   ├── rental-agreement.json
│   ├── authorization-letter.json
│   └── payment-reminder.json
├── public/
├── .env.local                   # Local secrets (never commit)
├── package.json
└── README.md
```

---

## 6. Template Format

Every template is one JSON file. Placeholders use `{{field_name}}`.

```json
{
  "id": "freelance-contract",
  "title": "Freelance Contract",
  "category": "Freelance",
  "description": "A simple agreement between a freelancer and a client.",
  "fields": [
    { "name": "client_name", "label": "Client name", "type": "text", "required": true },
    { "name": "freelancer_name", "label": "Freelancer name", "type": "text", "required": true },
    { "name": "project_description", "label": "Project description", "type": "textarea", "required": true },
    { "name": "amount", "label": "Total payment (PKR)", "type": "number", "required": true },
    { "name": "deadline", "label": "Deadline", "type": "date", "required": true },
    { "name": "late_fee", "label": "Late payment fee (optional)", "type": "text", "required": false }
  ],
  "sections": [
    {
      "title": "Parties",
      "content": "This agreement is between {{client_name}} (Client) and {{freelancer_name}} (Freelancer)."
    },
    {
      "title": "Scope of Work",
      "content": "The Freelancer will complete the following work: {{project_description}}"
    },
    {
      "title": "Payment",
      "content": "The Client agrees to pay {{amount}} for the work. The work must be completed by {{deadline}}."
    },
    {
      "title": "Late Payment",
      "showIf": "late_fee",
      "content": "Late payments will be charged: {{late_fee}}."
    }
  ]
}
```

**Supported field types:** `text`, `textarea`, `number`, `date`, `select` (with an `options` array).

**Rendering rules (keep these exactly):**

- Replace each `{{name}}` with the user's value.
- If the value is empty, show `[Field label]` highlighted (e.g. yellow background).
- If a section has `"showIf": "field_name"`, show it only when that field is not empty.
- Escape user input so it cannot inject HTML.
- Nothing in a template is ever executed as code.

---

## 7. Starter Templates (5 only)

| Template | Category |
|----------|----------|
| Non-Disclosure Agreement (NDA) | Business |
| Freelance Contract | Freelance |
| Rental Agreement | Property |
| Authorization Letter | Personal |
| Payment Reminder Letter | Finance |

Each template needs 5–8 fields and 4–6 sections. Do not make them longer than that.
**Do not describe templates as "legally verified"**; they are drafts.

---

## 8. Pages and User Flow

| Page | URL | What it does |
|------|-----|--------------|
| Home | `/` | Intro and button to browse templates |
| Templates | `/templates` | Search, filter, and open a template |
| Fill and Preview | `/templates/[id]` | Form on the left, live preview on the right (stacked on mobile) |
| My Documents | `/my-documents` | Saved drafts with Open / Duplicate / Delete |
| Help | `/help` | FAQ |

**Flow:** Home → Templates → choose one → fill form → check preview → tick checklist → Download PDF / Copy / Save.

---

## 9. Design (bright and simple)

| Use | Color |
|-----|-------|
| Primary buttons and links | Indigo `#4F46E5` |
| Accent | Cyan `#06B6D4` |
| Highlight / missing fields | Orange `#F97316` |
| Success messages | Green `#22C55E` |
| Page background | `#F8FAFC` |
| Cards | `#FFFFFF` |
| Main text | `#172033` |
| Secondary text | `#475569` |
| Borders | `#E2E8F0` |

Design rules:

- Light and dark mode, with a toggle button in the navbar
- Rounded cards, soft shadows, plenty of spacing
- Clear labels on all form fields
- Visible focus outline and readable contrast
- Friendly empty states, e.g. "No documents yet. Create your first one!"
- Print CSS: hide navbar, form, and buttons so only the document prints

---

## 10. Build Order (follow step by step)

### Stage 1: Works with no backend

- [ ] **Step 1:** Create the Next.js project with Tailwind. Add Navbar, Footer, and Disclaimer banner.
- [ ] **Step 2:** Build the Landing page.
- [ ] **Step 3:** Create the 5 template JSON files and `lib/templates.js`.
- [ ] **Step 4:** Build the Template library page with search and category filter.
- [ ] **Step 5:** Build `renderTemplate.js` (placeholder replacement, `showIf`, missing-field highlight).
- [ ] **Step 6:** Build `DynamicForm` and `DocumentPreview` on `/templates/[id]` with live preview and validation.
- [ ] **Step 7:** Add autosave, Reset, and Example-data buttons.
- [ ] **Step 8:** Add Print/PDF, Copy, Download .txt, and the review checklist.
- [ ] **Step 9:** Build the My Documents page (list, open, duplicate, delete) using `localStorage`.
- [ ] **Step 10:** Build the Help/FAQ page and polish the responsive layout.

✅ **At this point the project is complete and usable.** Test it fully before moving on.

### Deploy Stage 1 to Vercel (do this before Stage 2)

- [ ] **Step 11:** Push the project to GitHub and deploy it on Vercel (see section 12). Confirm the live site works.

### Stage 2: Connect Supabase

- [ ] **Step 12:** Create a Supabase project and run the SQL below to create the `documents` table with security rules.
- [ ] **Step 13:** Install the Supabase packages and add `lib/supabase/client.js` and `server.js`.
- [ ] **Step 14:** Add Register, Login, and Logout pages using Supabase Auth.
- [ ] **Step 15:** Update My Documents and the Save button to use Supabase instead of `localStorage`.
- [ ] **Step 16:** Add the same Supabase environment variables in Vercel, redeploy, and test on the live site.

Suggested Stage 2 table (users are handled by Supabase Auth, so no `User` table is needed):

| Table | Fields |
|-------|--------|
| `documents` | id (uuid), user_id (uuid → auth.users), template_id, title, data (jsonb), status (draft/completed), created_at, updated_at |

Run this in the Supabase **SQL Editor**:

```sql
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  template_id text not null,
  title text not null,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Users can view their own documents"
  on public.documents for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own documents"
  on public.documents for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own documents"
  on public.documents for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own documents"
  on public.documents for delete to authenticated
  using ((select auth.uid()) = user_id);
```

> Row Level Security (RLS) is what keeps each user's documents private. Never turn it off.

---

## 11. Getting Started

### Requirements

- Node.js (LTS version)
- npm

### Run the project

```bash
# 1. Create the project (if starting from scratch)
npx create-next-app@latest pre-legal-document-generator
cd pre-legal-document-generator

# 2. Install extra dependency
npm install lucide-react

# 3. Start the dev server
npm run dev
```

Open `http://localhost:3000`.

No environment variables are needed for Stage 1.

For Stage 2, install the Supabase packages:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Then create a `.env.local` file in the project root. Copy the values from your Supabase dashboard (**Project Settings → API**):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

Never commit `.env.local` to GitHub, and never use the `service_role` key in this project.

### Supabase Auth settings

In the Supabase dashboard (**Authentication**):

- Enable the **Email** provider.
- For easy testing, you can turn off "Confirm email". Turn it back on for a real launch.
- After deploying, add your Vercel URL (e.g. `https://your-app.vercel.app`) and `http://localhost:3000` to the allowed redirect/site URLs.

---

## 12. Deployment on Vercel

1. Push the project to a GitHub repository (make sure `.env.local` is in `.gitignore`).
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, and click **Add New → Project**.
3. Import your repository. Vercel detects Next.js automatically; keep the default settings.
4. **Stage 1:** click **Deploy**. No environment variables are needed.
5. **Stage 2:** before deploying, open **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click **Deploy**. Every future `git push` to the main branch redeploys the site automatically.
7. Copy your live Vercel URL into Supabase (**Authentication → URL Configuration**) so login works on the live site.

If you change environment variables later, redeploy for the change to take effect.

---

## 13. Testing Checklist (manual)

- [ ] Home page opens without errors
- [ ] All 5 templates appear in the library
- [ ] Search and category filter work
- [ ] Required fields show an error when empty
- [ ] Preview updates while typing
- [ ] Empty fields appear highlighted in the preview
- [ ] Optional sections appear and disappear correctly
- [ ] Refreshing the page keeps the draft
- [ ] Print → Save as PDF shows only the document
- [ ] Copy button copies the text
- [ ] Duplicate and Delete work on My Documents
- [ ] Looks good on a phone screen
- [ ] Disclaimer is visible on every page
- [ ] The Vercel deployment builds with no errors and the live site opens
- [ ] (Stage 2) Register and login work on the live Vercel URL
- [ ] (Stage 2) A saved document appears in the Supabase `documents` table
- [ ] (Stage 2) A second user cannot see the first user's documents
- [ ] (Stage 2) No Supabase `service_role` key appears anywhere in the code

---

## Advanced Features Setup (Stage 3)

All of these are built into the app. Each one needs a little setup outside the code.

| Feature | Where it lives | Setup needed |
|---------|----------------|--------------|
| **Google / Microsoft login** | `app/login` | Supabase → Authentication → Providers: enable **Google** and **Azure (Microsoft)** and paste each provider's client ID and secret |
| **Email verification** | `app/login` | Supabase → Authentication → Providers → Email: turn **Confirm email** ON. Add your site URL under URL Configuration |
| **Two-factor authentication (TOTP)** | `/security` | Supabase → Authentication → Multi-Factor: make sure TOTP is enabled |
| **Share links** | My Documents → Share | Run the full `supabase/schema.sql`. Links are random, last 7 days, and can be revoked |
| **E-signatures** | `/share/[token]` | Same SQL. Signers type their name; the name, date and time are recorded. This is a simple e-signature, not a certified digital signature |
| **Admin dashboard** | `/admin` | Run the SQL, then make yourself admin (command at the bottom of `schema.sql`). Shows aggregated numbers only |
| **Plans, quotas, invoices** | `/pricing`, `/billing`, `/api/*` | See Stripe setup below. Quotas are enforced inside the database, so they cannot be bypassed from the browser |
| **Dark / light mode** | Navbar button | None. Remembers the choice and follows the device by default |

### Stripe setup

1. Create a Stripe account and two recurring products: **Pro** ($9/month) and **Business** ($29/month). Copy each **price ID**.
2. Put `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS`, `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_APP_URL` in `.env.local` and in Vercel's Environment Variables.
3. In Stripe → Developers → Webhooks, add the endpoint `https://your-site.vercel.app/api/webhook` with these events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. For local testing, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhook`.
5. Test with Stripe's test card `4242 4242 4242 4242`.

Notes:

- Stripe must be available in the country where your business is registered. If it is not, replace the three files in `app/api/` with another provider; nothing else in the app talks to Stripe.
- Plan prices on the pricing page come from the `plans` table. The real charge comes from your Stripe price, so keep them in sync.
- Plan limits (documents per month) can be changed by an admin on `/admin`.
- Two-factor is checked when logging in with email and password. Logging in with Google or Microsoft relies on that provider's own security.

---

## 14. ❌ Out of Scope (do NOT build)

These were in the original plan and are still not built to keep the project simple:

- AI-assisted drafting or any AI API
- Teams, organizations, and workspace roles (only the user/admin role exists)
- DOCX export, rich-text editor, version history and restore
- Redis, background workers, queues, Supabase Storage / file uploads
- Docker, CI/CD pipelines, Sentry, monitoring
- Supabase extras beyond Auth and one table (realtime, edge functions)
- Multi-language support and multi-jurisdiction rules

These can be added later as separate projects once the MVP works.

---

## 15. Future Ideas (after the MVP is finished)

1. DOCX export
2. More templates (employment, demand letters)
3. Email verification and password reset
4. Optional AI "explain this clause" helper
5. Version history for documents

---

## 16. Disclaimer

Pre Legal Document Generator is a document-preparation tool. It does not provide legal representation or create an attorney-client relationship. Generated drafts may be incomplete, inaccurate, or unsuitable for a particular country or situation. Users are responsible for checking their information and getting qualified legal advice where appropriate.

## License

MIT License. Add a `LICENSE` file with the full MIT text before sharing the project publicly.
