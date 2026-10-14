# Transaction Lifecycle

# Transaction Lifecycle

Transfers follow `PENDING -> COMPLETED -> REVERSED`. State changes are exposed through guarded entity transitions; completed and reversed transactions cannot be completed again, and only completed transfers may be reversed.

A reversal is a separate completed transaction linked to its original transfer. Its debit and credit ledger entries compensate the original entries while retaining the original transaction and ledger history. Deposits and reversal transactions are not eligible for reversal through the transfer reversal flow.

Repeating a reversal request with the same idempotency key returns the existing reversal transaction. A different key cannot create another reversal for an already-reversed transfer.
