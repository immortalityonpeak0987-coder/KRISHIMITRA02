# KRISHI-MITRA Backend — Smart Agriculture & Allied Sector Monitoring System

Node.js and Express REST API backend for **KRISHI-MITRA**, an independent submission for the **Seva First Innovation Challenge – Eastern Region**, category **Agriculture & Allied Sector**.

> This is an independent submission. It is not officially affiliated with, endorsed by, or sponsored by Seva First, the Government of West Bengal, or any government agency. Open weather and satellite dataset names in the code describe factual data sources only.

## Purpose

The backend serves farm, weather, soil, risk, crop planning, recovery, and report data to the frontend. It preserves the existing API surface (`/api/*` and `/api/v1/*`), integrations, database models, and internal identifiers while using KRISHI-MITRA branding in user-facing messages, reports, and exported files.

## Quick start

```bash
npm install
cp .env.example .env
npm start
```

Development with auto-reload:

```bash
npm run dev
```

Optional MongoDB persistence can be configured with `MONGODB_URI`. When MongoDB is unavailable, the runtime store provides in-memory data so the API remains usable.

## Test suite

```bash
node --test tests/*.test.js
```

## Main route groups

| Group | Purpose |
| --- | --- |
| `/api/health`, `/api/v1/health` | Liveness and database status |
| `/api/farms`, `/api/v1/farms` | Farm registration and plot management |
| `/api/analyses`, `/api/v1/analyses` | Climate, soil, risk, rotation, and simulation data |
| `/api/reports`, `/api/v1/reports` | PDF/CSV advisory generation and download |
| `/api/integrations`, `/api/v1/integrations` | Open weather, satellite, and IMD data integrations |

Integration folder names, API URLs, cache keys, and internal source identifiers are intentionally unchanged for compatibility.

## Reports

PDF and CSV advisory reports use the KRISHI-MITRA title, neutral source labels, and the shared disclaimer from `src/services/report/reportConstants.js`. Reports clearly state that gridded estimates are regional context and do not replace laboratory soil testing or field verification.

## Data integrity

- Missing upstream values are preserved as missing, never changed to zero.
- Sample and demo records are clearly labelled.
- No fabricated sensor readings or unsupported AI claims are presented as live data.
- User-facing strings avoid competition or agency endorsement language.

## Environment

See `.env.example` for optional credentials and endpoints for open weather, satellite, and IMD integrations. Credentials are only required for providers that need authentication.

## Notice

Official challenge site: <https://sficeast.wb.gov.in/en>.

This project is an independent technical submission and does not claim partnership, endorsement, or affiliation with any government agency or challenge organiser.
