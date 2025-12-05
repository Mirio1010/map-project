# 🗺️ Map Project

## Overview

This site consists of an interactive map application where users can drop pins, assign tags, and add descriptions to locations they want to remember or share. Users can view pins from friends, filter locations by category, and explore only the spots that fall within their current map view. The aim is to create a social, personalized way to discover events, places, and experiences through a shared map.

![Demo](./src/assets/demo.gif)

### MVP’s:

- Map Background
- Drop a pin

### Features:

- User can see pins from other users
- Each user has a distinct pin for recognition
- User can assign a tag on a pin for filtering purposes
- User can add description, date and time on each pin

## Tech Stack

- **Frontend:** React, Tailwind CSS, JavaScript/TypeScript
- **Maps:** Leaflet / Mapbox / Google Maps API
- **Backend/Database:** Supabase or Firebase (for location data and user contributions)
- **Hosting:** Vercel or Netlify
- **Version Control:** Git & GitHub

## Supabase Authentication (local setup)

To enable authentication with Supabase, add the following environment variables to a `.env` file at the project root (Vite expects `VITE_` prefixes):

- `VITE_SUPABASE_URL` — your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public key

Example `.env` (do not commit this file):

```
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Install new dependencies and run the dev server:

```powershell
npm install
npm run dev
```

Open `http://localhost:5173/` and you'll see a landing page with Sign In and Sign Up flows that use Supabase. After signing in or signing up, the app navigates to `/app` where the main map UI remains.

## Team

This project is developed as part of the **CUNY Tech Prep Fellowship (2025–2026 Cohort)** by a collaborative student team across multiple CUNY campuses.

## 📑(For CISC 4900 Requirement Only) (CTP team ignore this)

This section is for my **CISC 4900 Independent Project class**.  
It contains my timelog and is not part of the project deliverables for the team.

👉 [View My Timelog](https://docs.google.com/spreadsheets/d/1t9WjDZbcMgz16ysqB7L7l7HQdXJRdsoC8jRkrP5u7Qs/edit?usp=sharing)

👉 [View Project Slides](https://docs.google.com/presentation/d/1AUJZLIb-Grsj2MFVBZWYGsEntbMhPm0vsZgXCs-9lrI/edit?usp=sharing)
