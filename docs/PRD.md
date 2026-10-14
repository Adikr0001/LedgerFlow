# Product Requirements Document

## Objective
LedgerFlow provides a simulated wallet and payment platform for learning financial consistency, transactional integrity, and distributed event processing.

## Users
- End users hold wallets and can transfer value between them.
- Administrators review audit logs and reconcile discrepancies.

## Core flows
1. Register and log in.
2. Create wallet.
3. Deposit funds.
4. Transfer between wallets.
5. View transaction history.
6. Reverse eligible completed transfers.
7. Review reconciliation and audit findings.

## Non-functional requirements
- Double-entry accounting and atomic financial updates.
- Idempotent write operations.
- Secure role-based access.
- Redis-based rate limiting and Kafka event publication.
- Observability and health endpoints.
