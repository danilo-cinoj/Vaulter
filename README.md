# Vaulter v1

Mobile-first anonymous-message and waitlist pages, built with Next.js and Supabase server-side persistence.

## Local setup

1. `npm install`
2. Create a Supabase project and run all SQL files in `supabase/migrations/` in filename order in its SQL Editor. The second migration adds a private `message-images` bucket; the third creates creator accounts and custom links.
3. Copy `.env.example` to `.env.local`, set the Supabase values from Project Settings → API, then set a long random `DASHBOARD_SESSION_SECRET`.
4. Run `npm run dev`, then open `http://localhost:3000`.

All environment values are server-only. Do not add `NEXT_PUBLIC_` to them and never commit `.env.local`. Visit `/` to create a custom `/m/handle` message link and private creator key; the creator key opens `/dashboard/handle`.

## Deploy

Push this project to GitHub, import it in Vercel, and add the same two environment variables under Project Settings → Environment Variables. Deploy; Vercel detects Next.js automatically. The API routes run on the server and use the service-role key there only.

## Notes

The API has server-side Zod validation, a hidden honeypot, and a lightweight in-memory IP rate limit. Images accept only JPEG, PNG, or WebP files up to 8 MB; their byte signatures are verified on the server and the bucket is private. The dashboard uses a signed, http-only 12-hour creator session and generates a 1080 × 1920 PNG for download or native mobile sharing. For higher traffic, add rate limiting at the edge (e.g. Vercel WAF/Upstash) because in-memory limits are per server instance.
