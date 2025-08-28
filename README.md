# Docvai Dashboard (Netlify)

A minimal, deploy-ready SPA + serverless API for Docvai (Bolna AI integration).

## Environment Variables
Set these in Netlify → Site settings → Environment:
```
DATABASE_URL=postgres://... (Neon)
JWT_SECRET=supersecretjwtkey123
BOLNA_API_KEY=bn-xxxxxxxxxxxxxxxx
BOLNA_AGENT_ID=8c87d6d3-e607-42d1-bf32-3c7058cab0c0
OUTBOUND_CALLER_ID=+918035316096
PUBLIC_SITE_URL=https://your-site.netlify.app
DEMO_USERS=admin@demo.com:demo123:t_demo,client1@demo.com:client123:t_client1
VITE_API_BASE=/.netlify/functions
```

## Deploy
- Connect repo or drag/drop zip to Netlify
- It will build the SPA and functions

## API Endpoints (via `/.netlify/functions`)
- `auth-login` – POST `{ email, password }` → `{ token }`
- `status` – GET health
- `debug-health` – GET env flags + DB check
- `agents` – GET (use `?refresh=1` to pull from Bolna and upsert)
- `calls-outbound` – POST `{ numbers:[], agentId? }` (uses Bolna `/call` with `{agent_id, recipient_phone_number}`)
- `analytics-summary` – GET (uses your `calls` schema: `started_at`, `duration_sec`, `status`/`disposition`)
- `analytics-timeseries?window=7d|30d` – GET

## Notes
- Functions are CommonJS to avoid ESM bundling issues on Netlify.
- Frontend calls `/.netlify/functions/*` by default to dodge redirect issues.
- Agents page has a "Refresh from Bolna" button that calls Bolna `/agent/all` and stores into `agents` table.
- Calls use your `calls` columns (`phone`, `started_at`, `duration_sec`, etc.).
