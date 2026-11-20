# KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System

<p align="center">
  <img src="public/assets/aistudio/file_000000008254821194a39b5f9b473b7c_37be7d74.png" alt="KRISHI-MITRA Logo" width="320" />
</p>

**Built by Team INOVATRIX**  
**Seva First Innovation Challenge – Eastern Region**  
**Category: Agriculture & Allied Sector**

> KRISHI-MITRA is an innovation project developed by **Team INOVATRIX**. It is not officially affiliated with, endorsed by, or sponsored by Seva First, the Government of West Bengal, or any government agency. Open satellite and weather datasets are used as factual data sources only.

---

## Team INOVATRIX — Core Contributors

| Role | Team Member |
| --- | --- |
| **Frontend Developer** | **Gourav Mondal** |
| **Backend Developer** | **Supriyo Karmakar** |
| **UI/UX Development** | **Jitesh Hati** |
| **API Integration** | **Adrija Dey** |
| **Communicator & Main Representer** | **Swati Suman** |

---

## Overview

**KRISHI-MITRA** (*Smart Kisan • Samriddh Bharat*) is a farmer-friendly, full-stack agricultural decision-support web application designed for smallholder farmers in Eastern India. It transforms open weather and satellite telemetry, local soil chemistry, regional crop calendars, and **Kisan Sahayak Smart AI** into clear, actionable guidance in **English**, **Bengali (বাংলা)**, and **Hindi (हिंदी)**.

---

## Key Features

- **My Farm Dashboard (`/app/overview`)**: Live plot weather, 30-day rainfall, soil moisture, crop greenness (NDVI), and an inline **Kisan Sahayak Smart Farm Advisory** card.
- **Weather & Alerts (`/app/climate`)**: 14-day rainfall & temperature forecasts, soil moisture trends, and smart climate advisories.
- **Crop Planner & 12-Month Calendar (`/app/crop-planner`)**:
  - Interactive 12-month crop calendar (`Jan–Dec`).
  - **Smart Location-Specific Crop Rotation Advisor** alongside 2 regional recommended crop rotation plans.
  - **What-If Weather & Sowing Delay Simulator** with freely clearable inputs and a location-specific **Smart Simulation Report**.
- **Soil Test & Multi-Hazard Risk (`/app/risk`)**:
  - **Smart Crop Leaf & Soil Photo Diagnosis** (upload field photo or test presets).
  - **Interactive Soil pH, Salinity (EC) & Nitrogen Simulator** with clearable inputs and a **Smart Location Soil Report**.
- **Farm Recovery Tracker (`/app/recovery`)**: Staged post-hazard recovery checklists, field visit logs, and a **14-Day Smart Farm Recovery Playbook**.
- **Interactive GIS Crop Health Map (`/app/satellite`)**: Multi-layer Leaflet map with satellite imagery, plot boundaries, salinity zones, and live GPS tracking.
- **Farm Registration (`/app/register-farm`)**: Interactive map pin selection, **Live GPS detection** (with hardware + network/district fallback), and dual persistence (**MongoDB** + local JSON folder `farmer_records/`).
- **Trilingual Kisan Sahayak AI Drawer**: Floating assistant supporting **English (`EN`)**, **Bengali (`বাংলা`)**, and **Hindi (`हिंदी`)**.
- **Printable Reports (`/app/reports`)**: Print-ready advisory summary, CSV export, and server-generated PDF.

---

## Tech Stack & Architecture

```text
KRISHI-MITRA/
├── src/                         # React 18 + Vite Frontend
│   ├── components/
│   │   ├── ai/                  # Smart Advisory Cards & Kisan Sahayak Drawer
│   │   ├── common/              # Navbar, Sidebar, Footer, DataSourceCard
│   │   └── map/                 # Leaflet GIS Map & Live GPS Picker
│   ├── config/brand.js          # Canonical KRISHI-MITRA & Team INOVATRIX metadata
│   ├── context/                 # FarmContext (Trilingual EN/BN/HI) & ThemeContext
│   ├── pages/                   # HomePage, AboutPage, and 10 Dashboard modules
│   └── services/                # API clients with resilient fallbacks
├── backend/                     # Express.js Full-Stack & Serverless API
│   ├── src/
│   │   ├── controllers/         # Farm, Analysis, Kisan AI, & Report controllers
│   │   ├── models/              # Mongoose schemas (Farm, SoilTest, RecoveryRecord)
│   │   ├── routes/              # REST endpoints (/api/v1/*)
│   │   ├── services/ai/         # Kisan Sahayak Smart AI engine with LRU caching
│   │   └── utils/localFarmStore.js # Local JSON persistence in farmer_records/
├── farmer_records/              # Auto-generated JSON records for registered farmer plots
├── api/index.js                 # Vercel Serverless Function entry point
├── server.js                    # Unified Node.js + Vite production/dev server (Port 3000)
└── vercel.json                  # Zero-config Vercel deployment routing
```

---

## Local Setup & Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and add your API key (and optional MongoDB URI):
   ```env
   MONGODB_URI=
   ```

3. **Start the full-stack development server (Port 3000):**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Run backend unit tests:**
   ```bash
   node --test backend/tests/*.test.js
   ```

---

## Deploying to GitHub & Vercel

This repository is pre-configured for **1-click Vercel deployment**:
- **`vercel.json`** routes all `/api/*` requests to the Express serverless handler (`api/index.js`) and serves the Vite SPA from `dist/`.
- **Optional Environment Variables on Vercel**:
  - `MONGODB_URI`: MongoDB Atlas connection string (automatically falls back to in-memory + `/tmp/farmer_records` JSON storage when omitted).

---

**© 2026 KRISHI-MITRA • Built by Team INOVATRIX**
