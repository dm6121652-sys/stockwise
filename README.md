# Stockwise

Stockwise is a mobile-first shop inventory and sales app built with Next.js, TypeScript, and Supabase.

## Run locally

```sh
npm install
npm run dev
```

Without Supabase credentials, use **Log in → Preview the shop dashboard** to explore the local preview. Preview data is stored in the browser.

## Connect Supabase

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and set the project URL and anon key.
3. Apply `supabase/migrations/202611200001_stockwise_core.sql` in the Supabase SQL editor or with the Supabase CLI.
4. In Supabase Auth, configure email confirmation and redirect URLs for the local and deployed app URLs.
5. Restart the development server.

The migration adds shop membership roles, row-level access policies, owner-created invite codes, stock movement records, and transactional sale recording. The app's sales flow stores queued sales locally while offline and submits them through the idempotent `record_sale` database function when the connection returns.

## Current scope

The public page, owner and staff account forms, dashboard, product list, checkout, sales history, team invite flow, and installable offline shell are implemented. The app can be explored in local preview mode before connecting Supabase. Shared shop data and account creation require the Supabase setup above. The demo workspace stays local to that browser.
