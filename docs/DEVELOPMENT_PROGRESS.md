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
