# Low-Level Design

## Domain model
- User: user account and role.
- Wallet: user-owned balance and currency.
- Transaction: financial event with statuses.
- LedgerEntry: immutable posting record.
- IdempotencyKey: unique request fingerprint per user and operation.
- AuditEvent: event log for review.

## Transfer flow
1. Validate identity and funds.
2. Lock source and target wallets with pessimistic writes.
3. Check idempotency.
4. Update balances and create two ledger entries in one transaction.
5. Publish outbox event for integration.
6. Notify user.
