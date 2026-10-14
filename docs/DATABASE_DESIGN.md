# Database Design

PostgreSQL holds the authoritative ledger. Wallet balances are materialized for quick reads but are derived from postings and validated during reconciliation. Transactions are immutable after completion; reversals create new compensating postings instead of mutating history.

## Key constraints
- Unique user+operation key in idempotency table.
- Wallet version column for optimistic retries.
- Foreign keys and not-null constraints on all financial records.
