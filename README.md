# LedgerFlow

LedgerFlow is a full-stack wallet and payments application: a Spring Boot API with a responsive React/TypeScript dashboard. Financial operations are processed by the backend and recorded in the double-entry ledger; the browser is not authoritative for balances.

## Features

- JWT registration and sign-in with browser session storage and protected routes
- Per-currency wallet overview, wallet creation, and clearly identified simulated deposits
- Wallet-to-wallet transfers, idempotency keys, transaction history, status details, and eligible transfer reversals
- Admin-only audit and reconciliation dashboards backed by protected API endpoints
- Operational API health, notifications, accessible responsive navigation, loading/error/empty states
- OpenAPI/Swagger backend docs and typed frontend models aligned with the API response contract
- Docker Compose integration for PostgreSQL, Redis, Kafka, the Spring Boot API, and Nginx-served frontend

Fraud flags and review workflows are **not exposed by the current backend API**, so the admin UI reports that limitation and does not show mock data. Admin screens require a real `ADMIN` token; public registration creates `USER` accounts only.

## Run locally

### Frontend + local backend

Use separate terminals:

```bash
# Terminal 1 — Spring Boot API and H2 local database
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

```bash
# Terminal 2 — React application with Vite API proxy to localhost:8080
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:5173`. The Vite development server proxies `/api` and `/actuator` to `http://localhost:8080`. Set `VITE_PROXY_TARGET` if the backend listens elsewhere. `VITE_API_BASE_URL` defaults to `/api/v1`; override it when using a separately hosted API.

### Full Docker Compose stack

Set a strong local JWT secret, then start the stack:

```bash
cp .env.example .env
# Replace JWT_SECRET with a random secret of at least 32 characters.
docker compose up --build
```

Open the frontend at `http://localhost:3000`. Nginx serves the single-page app and proxies API calls to the backend; API documentation remains at `http://localhost:8080/swagger-ui/index.html`. Stop the stack with `docker compose down`; add `-v` only if you intend to remove persistent PostgreSQL data.

Docker Compose execution depends on Docker being installed. In environments without Docker, use the local backend + Vite workflow above.

## Frontend development and tests

```bash
cd frontend
npm ci
npm test
npm run build
npm audit
```

Frontend tests cover sign-in/session persistence, API error feedback, actual transfer request wiring, transaction status display, and exact large monetary-string formatting. Backend tests:

```bash
cd backend
mvn verify
```

CI runs backend verification, frontend tests, a production build, and a complete dependency audit.

## API integration

The frontend calls `/api/v1/auth`, `/wallets`, `/transfers`, `/transactions`, `/notifications`, and the admin audit/reconciliation endpoints. API responses are modeled in `frontend/src/types/api.ts`; monetary inputs are submitted as decimal strings and checked by the backend. Transaction filters apply to the fetched page because the current API does not expose server-side filters.

Deposits are simulation-only operations in the backend. Do not use the app to process real funds.

## Configuration

- Java 21 and Maven for the backend.
- Node.js 26+ and npm for the frontend test/build toolchain.
- Local frontend API: `VITE_API_BASE_URL` (defaults to `/api/v1`) and `VITE_PROXY_TARGET` (defaults to `http://localhost:8080`).
- Direct cross-origin API deployments should set `APP_CORS_ALLOWED_ORIGINS` on the backend to exact trusted frontend origins; the default allows local Vite and Compose origins only.
- Docker Compose requires `JWT_SECRET` in root `.env`; do not commit `.env`.
- Compose backend database and infrastructure endpoints are configured for the internal service network.

## Screenshots

No screenshots are included yet. Run the frontend locally to capture the dashboard after signing in.

## API documentation

When the backend is running, visit `http://localhost:8080/swagger-ui/index.html` or fetch the OpenAPI document at `http://localhost:8080/v3/api-docs`.
