# trail-companion-web

React + Vite + Tailwind v4 + shadcn/ui template. Login against the TrailCompanion API, then "Hello world, {email}".

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
| `src/components/atoms` | Smallest app pieces (`Heading`, `ErrorText`) |
| `src/components/molecules` | Atoms/primitives combined (`FormField`) |
| `src/components/organisms` | Self-contained sections, props-only (`LoginForm`, `Greeting`) |
| `src/pages` | Routes: wire organisms to hooks/data |
| `src/auth` | `AuthProvider`, `useAuth`, `ProtectedRoute` |
| `src/lib` | `api` (fetch + `ApiError`), `authApi` (endpoints), `session` (token storage) |

## Auth

Follows `trail-companion-api/docs/auth.md`: JWT bearer, 15 min, no refresh. Login stores `{accessToken, expiresAtUtc}` in localStorage, loads `/api/users/me`, auto-logs out at expiry and on any 401 from `authFetch`. Use `useAuth().authFetch(path)` for protected calls.

Not included: register UI, 429 button cooldown.
