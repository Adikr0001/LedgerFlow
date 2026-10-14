# Transaction Lifecycle

Transfer states follow `PENDING -> COMPLETED` and `COMPLETED -> REVERSED` for compensating reversals. Reversals emit a second transaction while preserving the original ledger entries.
