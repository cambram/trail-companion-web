# trail-companion-web

Crewmate (repo `trail-companion-web`): trail race planner and crew companion UI. Register or log in against the TrailCompanion API, then plan races as segments of fuel items (carbs planned vs needed).

## Run

```bash
cp .env.example .env   # VITE_API_URL (default http://localhost:5170), FEATURE_REGISTRATION_ENABLED
npm install
npm run dev            # http://localhost:5173 (must match API Cors:AllowedOrigins)
```

## Structure (atomic design)

| Path | Role |
|---|---|
| `src/components/ui` | shadcn primitives (add more with `npx shadcn add <name>`) |
| `src/components/atoms` | Smallest app pieces (`Heading`, `ErrorText`, `StatusPill`) |
| `src/components/molecules` | Atoms/primitives combined (`FormField`, `StatRail`, `ConfirmButton`, `BackHeader`) |
| `src/components/organisms` | Self-contained sections, props-only (`AuthForm`, `Hero`, `SegmentCard`, `ItemList`, `RaceCard`, `NewRaceForm`, `CrewPlan`) |
| `src/pages` | Routes: wire organisms to hooks/data |
| `src/hooks` | `useRaces` (list), `useRace` (one race: debounced race/segment saves, reorder, item add/delete), `useCrew` (crew list, remove member) |
| `src/auth` | `AuthProvider`, `useAuth`, `ProtectedRoute` |
| `src/lib` | `api` (fetch + `ApiError`), `authApi`, `racesApi` (endpoints), `planMath` (carb/pace math, minutes), `session` (token storage) |

## Auth

Follows `trail-companion-api/docs/auth.md`: 15 min JWT bearer plus a 30-day refresh token in an httpOnly cookie. Every request uses `credentials: "include"` (`src/lib/api.ts`), or the cookie is never sent.

- Login stores only `{accessToken, expiresAtUtc}` in localStorage. The refresh token is never readable by JavaScript.
- `AuthProvider` refreshes 60s before expiry. On an expired-token 401 (empty body), `authFetch` refreshes once and retries once. Concurrent 401s share one in-flight refresh, because presenting a rotated cookie twice revokes the session.
- A 401 **with** ProblemDetails (wrong current password on the settings forms) is thrown to the caller and does not log out.
- Only a refresh 401 ends the session; offline or 429 keeps it for a later retry.
- On reload with an expired stored token, the first call refreshes via the cookie, so the user stays logged in.
- `logout()` calls `POST /api/users/logout` (revokes the cookie), then clears local state.

- Refreshes are serialised across tabs with `navigator.locks` (`trail-companion-refresh`); a waiting tab adopts the session another tab stored. The static host sends a strict CSP (`render.yaml` `headers`); no inline scripts. The theme bootstrap lives in `public/theme.js`.

A protected route redirects to `/login` with `state.from`, and login and register return there.

Use `useAuth().authFetch(path)` for protected calls.

Login 429 disables the button for 60s (fixed-window limit).

## Routes

| Path | Page |
|---|---|
| `/login`, `/register` | Auth (register logs in automatically) |
| `/` | Races list + create race |
| `/join`, `/join/:pin` | Join a race's crew by PIN |
| `/races/:id` | Race plan: segments and items. Renders the read-only crew view when `role` is `Crew` |
| `/races/:id/share` | Owner: PIN, QR, crew list |
| `/nutrition` | Nutrition library |
| `/settings` | Account info, name, theme, password, log out, delete account |

## Theme

System, Light or Dark from Settings. Stored as `localStorage.theme` (`light`/`dark`; absent = System) and applied before first paint by the inline script in `index.html`, which sets `data-theme` on `<html>`.

## Checks

```bash
node --experimental-strip-types src/lib/planMath.check.ts   # totals, pace, ETA math
node --experimental-strip-types src/lib/flags.check.ts      # feature flag parsing
```

## Editing

Race name, target and start time (hero) and segment fields save automatically (debounced `PUT`). Segments and items reorder with the arrow buttons via `PUT .../segments/order` and `PUT .../items/order` (complete id list).

## Deploy

Render static site (`render.yaml`). Client-side routes need an SPA rewrite: `public/_redirects` (`/* /index.html 200`) ships in `dist/`, and `render.yaml` declares the same rule. A service created by hand in the dashboard ignores `render.yaml`; add the rewrite under Redirects/Rewrites there or re-create it from the Blueprint. `VITE_API_URL` is set in the dashboard. `FEATURE_REGISTRATION_ENABLED` hides account creation when it is anything other than `true`. Unset means enabled. Vite reads it at **build** time, so changing it needs a redeploy. The API has its own variable with the same name, and the deploy must keep the two equal. The API enforces the flag either way.

## Not included

Item edit-in-place (API `PUT` exists, no UI).
