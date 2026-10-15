# Vercel Deployment

## Project Root

Deploy the `frontend` folder as the Vercel project root:

```text
Watch Project/frontend
```

If the parent repository is imported, set the Vercel **Root Directory** to `Watch Project/frontend`.

## Build Settings

- Framework preset: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `.next`
- Node.js version: 18 or newer

## Environment Variables

Add these variables in Vercel for Production, Preview, and Development:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://your-deployment.vercel.app
```

Use the real Supabase project values in the Vercel dashboard. Do not commit or upload `.env.local`.

The frontend does not need `SUPABASE_SERVICE_ROLE_KEY`. Never expose a Supabase service-role key to browser code.

## Verify Before Deploying

Run from the `frontend` directory:

```bash
npm install
npm run lint
npm run build
```

A successful build should finish with the generated route list and no TypeScript, ESLint, or prerender errors.
