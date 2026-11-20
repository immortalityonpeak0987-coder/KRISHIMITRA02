# Deploying KRISHI-MITRA

KRISHI-MITRA is a full-stack app: a React/Vite frontend and an Express API served by the same Node process. The included deployment files cover the common hosting paths.

## What is included

| File | Purpose |
| --- | --- |
| `Dockerfile` | Production image that builds the frontend and runs the full-stack server |
| `.dockerignore` | Keeps dependencies, secrets and build output out of the image |
| `render.yaml` | Render Blueprint for a one-click web service |
| `Procfile` | Start command for Railway / Heroku-style platforms |
| `vercel.json` + `api/index.js` | Vercel serverless deployment |
| `.env.example` | All supported environment variables |

## Prerequisites

- Node.js 20 or newer (Node 22 recommended)
- `MONGODB_URI` is optional for a demo. Without it the API runs on seeded in-memory data and resets on restart. Set it for persistent data.

## Option 1 — Render (recommended)

1. Push this project to GitHub.
2. In Render, choose **New → Blueprint** and select the repository.
3. Render reads `render.yaml` and creates the service.
4. Set `FRONTEND_URL` to the public URL Render assigns (for example `https://krishi-mitra.onrender.com`).
5. Optionally add `MONGODB_URI` for persistent data.
6. Deploy. Health check: `/api/health`.

## Option 2 — Docker (any container host)

```bash
docker build -t krishi-mitra .
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e ALLOW_MEMORY_DB=true \
  krishi-mitra
```

Open `http://localhost:3000`. To persist data, add `-e MONGODB_URI="mongodb+srv://..."`.

For a registry-based host (AWS ECS, Google Cloud Run, Azure Container Apps, Fly.io), push the image and expose port `3000`. Set `PORT` only if your platform requires a specific value.

## Option 3 — Vercel

1. Import the repository at vercel.com.
2. Vercel uses `vercel.json`; the API is served from `api/index.js`.
3. Add `MONGODB_URI` in Project → Settings → Environment Variables if you need persistence.

Note: Vercel functions have a read-only filesystem outside `/tmp`, so generated report files may not persist. Use Render or Docker if report downloads must be retained.

## Option 4 — Railway or other Node hosts

- Build command: `npm ci --include=dev && npm run build`
- Start command: `npm run start` (also provided in `Procfile`)
- Health check path: `/api/health`

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | Yes | Use `production` |
| `PORT` | No | Defaults to `3000`; most platforms inject it |
| `FRONTEND_URL` | Recommended | Public URL of the app, used for CORS |
| `MONGODB_URI` | No | MongoDB Atlas connection string for persistent data |
| `ALLOW_MEMORY_DB` | No | `true` allows the seeded in-memory fallback |
| `IMD_API_KEY` / `IMD_BEARER_TOKEN` | No | Only for live IMD feeds |
| `EARTHDATA_USERNAME` / `EARTHDATA_PASSWORD` / `EARTHDATA_TOKEN` | No | Only for AppEEARS tasks |
| `GOOGLE_CLOUD_PROJECT_ID` / `GOOGLE_APPLICATION_CREDENTIALS` | No | Only for Earth Engine compute |
| `REPORT_STORAGE_PROVIDER` | No | `LOCAL` (default) |

## Verify a deployment

```bash
curl https://YOUR-DOMAIN/api/health
curl https://YOUR-DOMAIN/api/farms
```

Then open the site and check the home page, dashboard, weather, crop health map, risk, crop planner, recovery and reports pages.

## Local production check

```bash
npm ci
npm run build
NODE_ENV=production npm run start
```

Open `http://localhost:3000`.
