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
