# Spoty — Engineering handoff

## Recent changes

- **2026-05-10 (friends map regression)** — `showFriendsPins` had defaulted to **false**, so **Map** always received `friendsPins={[]}` until the user turned “Show Friends” on. Reset default to **true** (matches expectations and prior UX). **`loadFriendsPins`** effect deps now include **`userIdForUi`** so friends reload once the Supabase session is known (first effect tick was sometimes `getUser()` → empty). **`isScheduledPinActive`** treats an empty `{}` schedule object like “no schedule” so legacy/empty JSONB rows don’t hide pins on the map.
- **2026-05-10 (later)** — **Pin visibility:** `App.jsx` keeps a full **all-user-pins** list (only `expires_at` pruned on load). Home filters produce **filteredMyPins** / **filteredFriendsPins** for the **sidebar** (all scheduled pins listed, including inactive windows). **visibleMapPins** and **visibleMapFriendsPins** apply `isScheduledPinActive` only for **Map** markers. Inactive pins show an **Inactive** badge + `formatNextActiveLine()` (“Next active: …”) in **sidebar**, **Profile** “My Places”, and **Explore** friend cards. **Reverse geocode (display-only):** `src/utils/geocodeUtils.js` (Nominatim, session cache, ~1s spacing between requests, `User-Agent` set) + `PinResolvedAddress.jsx` for sidebar, Explore/Profile cards, and **AddSpotModal** “Shown as: …” when address is empty or coordinate-like — DB `address` is never updated by this. **Profile** header adds **Add Spoty Team** (reuses `devAccounts.js`, checks `friends` on mount / `friendsDataVersion`, grey **Already following ✓** when applicable).
- **2026-05-10** — Tutorial completion uses `localStorage` key `tutorial_done_<Supabase user id>` with value `"true"` (legacy `"1"` still counts as done). Auto-show runs only after auth/session resolves (`getSession` + `onAuthStateChange` in `App.jsx`), so the key always matches the logged-in user. Header **Tutorial** replay opens the overlay without clearing that flag. Temporary `console.log` lines tag `[tutorial] storage check` / `storage write` for debugging.
- **2026-05-10** — Shared dev/team friend helper: `src/utils/devAccounts.js` exports `DEV_ACCOUNTS`, `buildExploreFollowBodyText`, and `addDevAccountFriend` for `TutorialOverlay.jsx` and the persistent **Add Spoty Team** control on Explore (bumps `friendsDataVersion` via `onSpotyTeamFriendAdded`). Explore reloads its friends list when `friendsDataVersion` changes so filters/cards stay in sync with Home map data.
- **2026-05-10** — Profile tab: users with no stored username (`profiles.username` null/empty) get a one-time **Create your username** flow (sanitize, availability check with `.select('id').eq(...)`, save with `.update().eq('id', …)`). Existing usernames show a grey **Username already set** control with an explanatory toast; `Header` display name refreshes via `profileRefreshKey` when a username is saved.

- **2026-05-09** — Added first-time + replayable onboarding (`TutorialOverlay.jsx` / `.css`) and recurring “scheduled” pins via Supabase `locations.schedule` JSONB + `scheduleUtils.js`; `expires_at` retained for legacy one-shot deletion only.
- **2026-05-09** — Tutorial overlay fix: mount `TutorialOverlay` after main tab content in `App.jsx`, drive visibility with `isOpen` only (stable mount), stop re-running home-prep when `activeTab` changes (that was snapping users back to Home on Explore/Profile steps), and re-measure spotlight targets after tab paint.
- **2026-05-09** — Signup username field + availability check (`usernameUtils.js`), display names prefer `profiles.username` with email-prefix fallback; Profile username is read-only for now. Explore tutorial step includes **Add Spoty Team** (insert `friends` row; duplicate ignored) and bumps `friendsDataVersion` in `App.jsx` to refresh pins.

This document orients a new maintainer to the **Spoty** map app (`package.json` name: `spoty-react`): what it does, how it is structured, and what you need to run and extend it.

## Product summary

Spoty is a social map for saving and sharing **location pins** (name, address, description, category, images, rating, optional expiry). Authenticated users see their pins on a Leaflet map, can add pins by clicking the map or from the sidebar, and can optionally surface **friends’ pins** with per-friend colors. There are separate areas for **Explore**, **Profile**, and **About**.

Public marketing and auth live outside the main shell; the interactive app lives under `/app`.

## Tech stack

| Layer | Choice |
|--------|--------|
| UI | React 19 (JSX), Vite 7 |
| Routing | `react-router-dom` v6 |
| Map | Leaflet + `react-leaflet` v5 |
| Backend | Supabase (Auth + Postgres) |
| Icons | `lucide-react`, `react-icons` |

Styling is primarily **custom CSS** under `src/styles/` and component-scoped CSS files (e.g. `landing.css`). The README mentions Tailwind; the repo’s day-to-day styling is the CSS files above.

## Routes (`src/main.jsx`)

| Path | Component | Role |
|------|-----------|------|
| `/` | `Landing.jsx` | Marketing / entry |
| `/signin` | `SignIn.jsx` | Supabase email/password sign-in → navigates to `/app` |
| `/signup` | `SignUp.jsx` | Registration flow |
| `/app/*` | `App.jsx` | Main map application (tabs: home, explore, profile, about) |

There is no nested router under `/app`; `App` uses local `activeTab` state driven by `Header`, not URL segments.

## Environment and local run

1. Copy or create `.env` at the **repository root** (never commit secrets):

   ```bash
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-public-key>
   ```

2. Install and start:

   ```bash
   npm install
   npm run dev
   ```

   Default Vite URL: `http://localhost:5173/`.

3. Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

If env vars are missing, `src/utils/supabaseClient.js` logs a warning; auth and data calls will not work reliably.

## Backend / data model

Authoritative SQL, RLS policies, and notes are in **`SUPABASE_SETUP.md`**. Summary:

- **`profiles`** — `id` (matches `auth.users`), `username`, `email`, optional `profile_picture`, timestamps. Optional DB hardening: **unique index on `username`** (see `SUPABASE_SETUP.md` → “Unique username”).
- **`locations`** — pins: `user_id`, geo (`lat`, `lng`), metadata (`name`, `address`, `description`, `category`, `images` array, `rating`), optional **`expires_at`** (legacy one-shot expiry; expired rows deleted in the background when the current user loads their pins — `App.jsx`), optional **`schedule`** JSONB for recurring visibility (pins hide outside active windows without being deleted — see `SUPABASE_SETUP.md` and `scheduleUtils.js`).
- **`friends`** — rows `(user_id, friend_id)`; app loads friend IDs for the current user, then loads those users’ `locations`. Relationships are **directed** as documented in `SUPABASE_SETUP.md` (one user “adding” another).

Optional Supabase Storage bucket **`avatars`** for profile pictures is described in the same doc.

## Frontend architecture

### Entry and shell

- **`App.jsx`** is the hub: loads the signed-in user’s pins and friends’ pins from Supabase, owns modal/sidebar/map state, filtering (categories, rating range, sort, “top 10”, friend filter), and CRUD for pins.
- **`TutorialOverlay.jsx`** — spotlight onboarding; rendered **after** tab content in `App.jsx` with `isOpen={tutorialOpen}` so it never unmounts when switching tabs. Step reset on open/replay is internal (not via changing `key`).
- **`Header.jsx`** — sidebar toggle, tab switching (`home` | `explore` | `profile` | `about`).
- **`Footer.jsx`** — global footer.

### Home (map) flow

- **`map.jsx`** — Leaflet map; receives `pins`, `friendsPins`, `friendUsernames`, `friendColors`, `mapAction` (zoom / locate / popup), `onClickOnMap`.
- **`sidebar.jsx`** — Lists pins, filters, toggles (my pins / friends / top 10), zoom-to-pin, add spot, geolocate.
- **`AddSpotModal.jsx`** — Create/edit pin; coordinates from map click or manual entry; categories from `src/utils/pinCategories.js`.
- **`pinCategories.js`** — Category list and Leaflet icon helpers (`createPinIcon`, `createColoredPinIcon` for friends).

### Other tabs

- **`Explore.jsx`** — Separate exploration UI (receives `pins` from `App`; only schedule-active pins are passed today).
- **`Profile.jsx`** — User profile (Supabase-backed; see component for fields and storage usage).
- **`FriendsSection.jsx`** — Friend management UI used from profile (or related flows).
- **`About.jsx`** — Static/about content.

### Auth pages

- **`Landing.jsx`**, **`SignIn.jsx`**, **`SignUp.jsx`**, **`LogoutButton.jsx`** — Auth UX wired to `supabase` client.

### Usernames (`src/utils/usernameUtils.js`)

- **Signup** (`SignUp.jsx`): optional username (3–20 chars, `[a-zA-Z0-9_-]`); blank → derived from email local-part (non-alphanumeric stripped except `_` `-`, lowercased, padded to ≥3 chars when needed). **Check availability** sanitizes input, then `profiles.select('id').eq('username', sanitized).maybeSingle()` — UI shows only available/taken, never other fields.
- **Persistence**: on sign-up, `profiles` insert uses `sanitizeUsernameForStorage` (final fall back `deriveUsernameFromEmail` if needed).
- **Display**: `profileDisplayName(profile)` → `username` || `email` prefix || fallback. Used in Header, sidebar friend filter, Explore, map labels (via `friendUsernames`), Profile friend list, FriendsSection success toast.
- **Editing**: One-time creation for accounts missing `profiles.username` is implemented in `Profile.jsx`; changing an existing username remains deferred (see toast copy).

**Security notes (client)**: all username lookups use parameterized `.eq()` / `.in()` only; sanitize with `/[^a-zA-Z0-9_-]/g` before DB calls. Request volume is bounded by **Supabase anon-key / project limits** (no extra app-level rate limiter).

## Deployment notes

- **Production URL** (from README): https://spotymap.netlify.app/
- **`public/_redirects`** — SPA fallback for Netlify (`/*` → `/index.html` 200).
- Set the same `VITE_*` variables in the host’s build environment so the client bundle contains the Supabase URL and anon key at build time.

## Known behaviors / caveats

1. **Pins when logged out** — `App.jsx` loads pins only when `supabase.auth.getUser()` returns a user; otherwise pin lists are empty. Unauthenticated users hitting `/app` get an empty map experience unless you add a guard or redirect.
2. **Friend colors** — Assigned in `App.jsx` when friend profiles load; palette is fixed in code; persistence of color per friend across sessions is in-memory state only (refresh may reshuffle if logic changes).
3. **Expired pin cleanup** — Deletion runs in a `forEach` of async calls without awaiting all completions; acceptable for “best effort” cleanup but not a guaranteed batch transaction.
4. **Scheduled vs legacy expiry** — Recurring pins use `schedule`; the map and lists hide them whenever `isScheduledPinActive` is false (`scheduleUtils.js`). **`expires_at` is legacy only** — still triggers hard deletion for old rows without `schedule`; do not rely on `expires_at` for recurring pins (leave it null).
5. **Supabase migration** — New installs should add `schedule JSONB`; existing projects must run the SQL in `SUPABASE_SETUP.md` before scheduled pins persist.
6. **Package vs README** — `package.json` uses `spoty-react`; marketing name is Spoty. Align naming in docs if you publish the package.

## File map (quick reference)

```
src/
  App.jsx              # Main state, data loading, tabs
  main.jsx             # Router + routes
  components/          # UI pieces — includes TutorialOverlay.jsx + TutorialOverlay.css (spotlight onboarding)
  styles/              # Global and feature CSS
  utils/
    supabaseClient.js  # createClient + env
    pinCategories.js   # Categories + Leaflet icons (+ scheduled marker styling constant)
    scheduleUtils.js     # recurring schedule helpers for pins
    usernameUtils.js     # username sanitize, derive-from-email, display helper
    devAccounts.js       # Spoty Team friend id + add helper + tutorial Explore copy
    geocodeUtils.js      # Nominatim reverse geocode (display-only), coordinate detection
public/_redirects      # Netlify SPA routing
SUPABASE_SETUP.md      # DB schema & RLS
README.md              # Overview, demo links, team
```

## Standing rule — database changes (chat / PR summaries)

Whenever work touches the Supabase schema (new column, table, policy, index, etc.), the agent or author must end the user-facing summary with a section titled **`## Database changes — run these in Supabase SQL Editor`**, using this pattern:

- Number steps in **run order**.
- **Plain-English** line above each step (what it does and why).
- **Each SQL statement in its own fenced code block.**
- Call out **warnings** if a step can affect or fail on existing data (e.g. duplicates before a unique index).

If nothing in the DB needs to change, end with exactly:

**`## Database changes — none required for this update`**

Authoritative copy-paste migrations and context also live in **`SUPABASE_SETUP.md`**; the chat section should mirror or point there for anything non-trivial.

## Suggested first tasks for a new owner

1. Confirm Supabase project matches `SUPABASE_SETUP.md` (tables, RLS, optional `expires_at` / `email` migrations).
2. Run `npm run dev` with a real `.env` and walk: sign up → `/app` → add pin → friend flow (if used).
3. Read `App.jsx` data effects (`loadPins`, `loadFriendsPins`) before changing filtering or map props—they are the source of truth for what the map and sidebar display.

---

*Handoff document for repository continuity; update it when architecture or deployment meaningfully changes.*
