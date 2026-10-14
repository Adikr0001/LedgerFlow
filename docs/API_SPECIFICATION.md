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
