# API Specification

## Auth
- POST /api/v1/auth/register
- POST /api/v1/auth/login

## Wallet
- POST /api/v1/wallets
- GET /api/v1/wallets
- GET /api/v1/wallets/{walletId}
- GET /api/v1/wallets/{walletId}/balance
- POST /api/v1/wallets/{walletId}/deposits

## Transaction
- POST /api/v1/transfers
- GET /api/v1/transactions/{transactionId}
- GET /api/v1/transactions
- POST /api/v1/transactions/{transactionId}/reversals

## Admin
- GET /api/v1/admin/audit-events
- GET /api/v1/admin/reconciliation

## Notifications
- GET /api/v1/notifications

## Health
- GET /actuator/health

The frontend's request and response interfaces are maintained in `frontend/src/types/api.ts`. The current API does not provide fraud review endpoints or server-side transaction search/status filters.
## Monetary response values

All monetary values in API responses (`balance` and transaction `amount` fields) are decimal strings, not JSON numbers. Clients should preserve these strings and must not use binary floating-point arithmetic for financial calculations. Monetary request values may be submitted as decimal strings.
