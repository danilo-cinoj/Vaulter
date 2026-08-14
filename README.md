# Vaulter v1

Mobile-first anonymous-message and waitlist pages, built with Next.js and Supabase server-side persistence.

## Local setup

1. `npm install`
2. Create a Supabase project and run `supabase/migrations/20260814_create_vaulter_v1.sql` in its SQL Editor.
3. Copy `.env.example` to `.env.local` and set the two values from Supabase Project Settings → API.
4. Run `npm run dev`, then open `http://localhost:3000`.

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Do not add `NEXT_PUBLIC_` to either variable and never commit `.env.local`.

## Deploy

Push this project to GitHub, import it in Vercel, and add the same two environment variables under Project Settings → Environment Variables. Deploy; Vercel detects Next.js automatically. The API routes run on the server and use the service-role key there only.

## Notes

The API has server-side Zod validation, a hidden honeypot, and a lightweight in-memory IP rate limit. For higher traffic, add rate limiting at the edge (e.g. Vercel WAF/Upstash) because in-memory limits are per server instance.
