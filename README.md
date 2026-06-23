# Spendwise Backend

REST API for the **Spendwise** personal expense-tracking mobile app (React Native).
Node.js + Express + PostgreSQL, JWT auth (access + rotating refresh tokens).

## Response conventions (strict — the mobile client depends on these)

- **Success:** every 2xx response is wrapped: `{ "data": <payload> }`
  (the client always reads `response.data.data`). Deletes return `{ "data": null }`.
- **Error:** non-2xx with a human-readable, top-level message: `{ "message": "..." }`
  (shown directly to the user; an optional `details` field is added in development).
- **Auth header:** `Authorization: Bearer <accessToken>` on every protected request.
- **Expired / invalid access token on a protected route → HTTP 401** (never 403).
  401 is what triggers the client's silent-refresh / re-login flow.

## Requirements

- Node.js >= 18
- PostgreSQL >= 13 (the `pgcrypto` extension is enabled by the seed script)

## Setup

```bash
npm install
cp .env.example .env        # then edit values as needed
createdb spendwise          # or create the DB however you like
npm run db:seed             # creates schema + demo data + a test user
npm run dev                 # nodemon, or: npm start
```

The server binds to `0.0.0.0:3000` and serves everything under `/api`
(e.g. `POST /api/auth/login`). From the Android emulator the host is
reachable at `http://10.0.2.2:3000`. CORS is open in development.

Interactive API docs (Swagger UI): **http://localhost:3000/api/docs**
Raw OpenAPI JSON: **http://localhost:3000/api/docs.json**

## Environment variables

| Variable | Default | Notes |
|---|---|---|
| `NODE_ENV` | `development` | |
| `PORT` | `3000` | |
| `DB_HOST` / `DB_PORT` | `localhost` / `5432` | |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | `spendwise` / `postgres` / `postgres` | required |
| `DB_POOL_MAX` / `DB_IDLE_TIMEOUT_MS` | `10` / `30000` | |
| `CORS_ORIGIN` | `*` | |
| `JWT_ACCESS_SECRET` | dev fallback | **required in production** |
| `JWT_ACCESS_TTL` | `15m` | access-token lifetime |
| `JWT_REFRESH_TTL_DAYS` | `30` | refresh-token lifetime |

## Test user

The seed creates a ready-to-use account:

- **email:** `test@grosz.app`
- **password:** `test1234`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@grosz.app","password":"test1234"}'
```

## Auth model

- **Access token** — short-lived JWT (`15m`), stateless. A stored access token
  alone authenticates a fresh app launch (no server lookup needed).
- **Refresh token** — long-lived, opaque random UUID, stored **hashed** (SHA-256)
  in the `refresh_tokens` table. Rotated on every `/auth/refresh` (the presented
  token is single-use and revoked); revoked server-side on `/auth/logout`.

## Endpoints

### Auth
| Method | Path | Auth | Body | Success |
|---|---|---|---|---|
| POST | `/api/auth/register` | – | `{ name, email, password }` | `201 { data: { accessToken, refreshToken, user } }` |
| POST | `/api/auth/login` | – | `{ email, password }` | `200 { data: { accessToken, refreshToken, user } }` |
| POST | `/api/auth/refresh` | – | `{ refreshToken }` | `200 { data: { accessToken, refreshToken } }` |
| POST | `/api/auth/logout` | Bearer | – | `200 { data: null }` |

### Users (all protected)
| Method | Path | Body | Success |
|---|---|---|---|
| GET | `/api/users/me` | – | `200 { data: User }` (caller, from token) |
| GET | `/api/users` | – | `200 { data: User[] }` |
| GET | `/api/users/:id` | – | `200 { data: User }` |
| POST | `/api/users` | `{ email, name, currency? }` | `201 { data: User }` |
| PATCH | `/api/users/:id` | `Partial<{ email, name, currency }>` | `200 { data: User }` |
| DELETE | `/api/users/:id` | – | `200 { data: null }` |

Also protected (app data): `/api/categories`, `/api/expenses`, `/api/budget-limits`
(see Swagger UI). Missing/invalid bearer token on any protected route → `401 { message }`.

### User shape

```json
{
  "id": "b1000000-0000-0000-0000-000000000001",
  "email": "jan@example.com",
  "name": "Jan Kowalski",
  "currency": "PLN",
  "created_at": "2026-06-23T10:15:00.000Z"
}
```

`password_hash` is never returned. New users default to `currency: "PLN"`.

## Example payloads

**Register** → `201`
```json
// POST /api/auth/register
{ "name": "Jan Kowalski", "email": "jan@example.com", "password": "tajneHaslo123" }
// →
{ "data": { "accessToken": "eyJ...", "refreshToken": "f7a9c2e0-...", "user": { "...": "..." } } }
```
Duplicate email → `409 { "message": "Konto z tym adresem e-mail już istnieje." }`

**Login** → `200 { data: { accessToken, refreshToken, user } }`
Bad credentials → `401 { "message": "Nieprawidłowy e-mail lub hasło." }`

**Refresh** (both tokens are new) → `200 { data: { accessToken, refreshToken } }`
Invalid/expired/revoked → `401 { "message": "Sesja wygasła. Zaloguj się ponownie." }`

**Any protected route, missing/invalid token** → `401 { "message": "Brak autoryzacji." }`

## npm scripts

| Script | Purpose |
|---|---|
| `npm start` | run the server |
| `npm run dev` | run with nodemon |
| `npm run db:seed` | (re)create schema + demo data + test user |
| `npm run build:check` | `node --check` syntax check |

## Project layout

```
src/
  app.js              Express app assembly (CORS, helmet, swagger, routes)
  container.js        Dependency wiring (models -> services -> controllers)
  middleware/         authenticate (JWT->401), validate, error/notFound handlers
  models/             Data access (BaseModel + UserModel, RefreshTokenModel, ...)
    config/           env, database pool, swagger/OpenAPI spec
    controllers/      Thin HTTP controllers (AuthController, UserController, ...)
  services/           Business logic (AuthService, TokenService, UserService, ...)
  routes/             Route definitions (authRoutes, userRoutes, ...)
  db/seed.sql         Schema + demo data
scripts/seed.js       Runs db/seed.sql
server.js             Entry point (DB check, listen on 0.0.0.0:PORT, shutdown)
```
