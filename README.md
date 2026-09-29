# trail-companion-web

Trail race planner UI. Register or log in against the TrailCompanion API, then plan races as segments of fuel items (carbs planned vs needed).

## Run

```bash
cp .env.example .env   # VITE_API_URL, default http://localhost:5170
npm install
npm run dev            # http://localhost:5173 (must match API Cors:AllowedOrigins)
```

## Structure (atomic design)

| Path | Role |
|---|---|
| `src/components/ui` | shadcn primitives (add more with `npx shadcn add <name>`) |
| `src/components/atoms` | Smallest app pieces (`Heading`, `ErrorText`, `StatusPill`) |
| `src/components/molecules` | Atoms/primitives combined (`FormField`, `StatRail`, `ConfirmButton`) |
| `src/components/organisms` | Self-contained sections, props-only (`AuthForm`, `Hero`, `SegmentCard`, `ItemList`, `RaceCard`, `NewRaceForm`) |
| `src/pages` | Routes: wire organisms to hooks/data |
| `src/hooks` | `useRaces` (list), `useRace` (one race: debounced race/segment saves, reorder, item add/delete) |
| `src/auth` | `AuthProvider`, `useAuth`, `ProtectedRoute` |
| `src/lib` | `api` (fetch + `ApiError`), `authApi`, `racesApi` (endpoints), `planMath` (carb/pace math, minutes), `session` (token storage) |

## Auth

Follows `trail-companion-api/docs/auth.md`: JWT bearer, 15 min, no refresh. Login stores `{accessToken, expiresAtUtc}` in localStorage, loads `/api/users/me`, auto-logs out at expiry and on any 401 from `authFetch`. Use `useAuth().authFetch(path)` for protected calls.

Login 429 disables the button for 60s (fixed-window limit).

## Routes

| Path | Page |
|---|---|
| `/login`, `/register` | Auth (register logs in automatically) |
| `/` | Races list + create race |
| `/races/:id` | Race plan: segments and items |

## Checks

```bash
node --experimental-strip-types src/lib/planMath.check.ts   # totals, pace, ETA math
```

## Editing

Race name, target and start time (hero) and segment fields save automatically (debounced `PUT`). Segments and items reorder with the arrow buttons via `PUT .../segments/order` and `PUT .../items/order` (complete id list).

## Deploy

Render static site (`render.yaml`). Client-side routes need an SPA rewrite: `public/_redirects` (`/* /index.html 200`) ships in `dist/`, and `render.yaml` declares the same rule. A service created by hand in the dashboard ignores `render.yaml`; add the rewrite under Redirects/Rewrites there or re-create it from the Blueprint. `VITE_API_URL` is set in the dashboard.

## Not included

Item edit-in-place (API `PUT` exists, no UI).
