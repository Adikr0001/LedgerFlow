# Development Progress

## Development Day 8 — 2026-10-15

- **Milestone:** Concurrency tests, locking, and race-condition fixes.
- **Implementation:** Added pessimistic locking for original transactions during reversal, deterministic ascending wallet lock order, database constraints preventing negative balances and duplicate reversals, and integration tests for concurrent spending, opposing transfers, and competing reversals.
- **Tests:** `mvn -Dtest=LedgerFlowConcurrencyTest test` — 3 tests passed. `mvn verify` — 5 tests passed, 0 failures, 0 errors; package verification succeeded. Flyway validated and applied both migrations under the local H2 test profile.
- **Runtime:** Spring application contexts started successfully as part of integration tests. Docker Compose and standalone health verification were not run in this session.
- **Commit:** `10e7961c858048abf331ecb10a9cce0af6103802` — `test: harden concurrent wallet operations`.
- **Push:** Pushed to `origin/main`; GitHub accepted the update from `8f80ec5` to `10e7961`.
- **Remaining issues:** Production PostgreSQL concurrency behavior and Docker-backed integration remain unverified because Docker is unavailable in this environment. Existing unrelated local edits in `ApiExceptionHandler.java`, `KafkaConfig.java`, and `JwtService.java` remain uncommitted.
- **Next scheduled milestone:** Day 9 — harden transaction state transitions, reversal eligibility, and compensating ledger entries.

## Development Day 9 — 2026-10-15

- **Milestone:** Transaction state management, reversal eligibility, and compensating ledger entries.
- **Implementation:** Added guarded `PENDING -> COMPLETED` and `COMPLETED -> REVERSED` entity transitions; restricted reversals to transfers; made same-key reversal retries return the existing reversal while different-key retries conflict; verified reversals create a matching debit/credit pair without changing the original ledger history.
- **Tests:** `mvn -q -Dtest=LedgerFlowConcurrencyTest,LedgerFlowFinancialFlowTest test` and `mvn -q verify` — 6 tests passed, 0 failures, 0 errors; package verification succeeded.
- **Runtime:** Integration-test Spring contexts started successfully using local H2.
- **Commit:** `d218f1d3033f0c204f505bbc6f918748567a24fb` — `feat: enforce transaction lifecycle and reversal rules`.
- **Push:** Pushed to `origin/main`; remote head confirmed as `d218f1d3033f0c204f505bbc6f918748567a24fb`.
- **Remaining issues:** Day 9 was tested against H2; production PostgreSQL and Docker-backed execution are still unverified because Docker is unavailable.
- **Next scheduled milestone:** Day 10 — reconciliation jobs and discrepancy reporting.

## Frontend milestone — 2026-10-15 (planned Days 16–19 scope, advanced)

- **Milestone:** Implement the required React application and connect its authentication, wallet, transfer, transaction, and admin surfaces to the Spring Boot API. This work was advanced ahead of backend Days 10–15 at the user's request; those milestones are not marked complete.
- **Implementation:** Added a responsive React/TypeScript/Vite application with Tailwind 4, accessible authentication and protected routes, wallet creation and simulated deposits, typed API integration, transfers, paginated transaction history and reversal requests, admin audit/reconciliation/health views, and loading/error/empty states. Fraud review is explicitly disclosed as unavailable because the backend has no fraud endpoints. Added CORS support and server-side transfer currency matching. Monetary API response values are now exact decimal strings so JavaScript cannot round authoritative amounts. Updated Docker Compose, CI, setup docs, and frontend API docs.
- **Tests:** `cd frontend && npm ci && npm test && npm run build` — 5 frontend tests passed, strict TypeScript and production build passed. `npm audit` — 0 vulnerabilities. `cd backend && mvn -q verify` — 10 tests passed (4 application/API, 5 concurrency, 1 financial-flow), 0 failures/errors. Exact large-decimal JSON serialization and decimal-string OpenAPI schemas are covered by backend regression tests.
- **Runtime:** Browser smoke test against a fresh local Spring Boot/H2 backend verified registration, wallet creation, a simulated USD 123.45 deposit, exact USD 123.4500 display, and the completed transaction row. A two-user API flow verified authentication, a USD 17.25 transfer, same-key transfer replay, reversal, same-key reversal replay, and exact balances returning to their pre-transfer values. API health returned `{"status":"UP"}`. Docker Compose could not be started because the Docker CLI is not installed; PostgreSQL/Redis/Kafka-backed runtime remains unverified.
- **Security and limitations:** Complete frontend dependency audit is clean. No real-money processing is claimed; deposits are simulated. Backend transaction search/status filtering remains page-local, and fraud review remains unavailable without API support.
- **Commit:** `2ca4d9650499543ec1b3bc474eeb209c61f3f727` — `feat(web): deliver LedgerFlow frontend and API integration` (49 files changed).
- **Push:** Pushed to `origin/main`; remote head verified as `2ca4d9650499543ec1b3bc474eeb209c61f3f727`.
- **Next scheduled milestone:** Resume Day 10 — reconciliation jobs and discrepancy reporting; frontend work is ahead of the original plan.
