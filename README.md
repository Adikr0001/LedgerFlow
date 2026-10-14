# LedgerFlow

LedgerFlow is a Spring Boot application for a distributed wallet and payment simulation. It demonstrates idempotent transfers, double-entry accounting, JWT-based auth, Redis-backed rate limiting hooks, Kafka event publication, reconciliation, and audit logging.

## Features
- User registration and JWT login
- Wallet creation and deposits
- Inter-wallet transfers with ledger postings
- Idempotent financial write operations
- Reversal workflow for eligible completed transfers
- Admin audit and reconciliation endpoints
- Docker Compose for PostgreSQL, Redis and Kafka

## Run locally

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

## API docs
Visit `http://localhost:8080/swagger-ui/index.html` once the app is running.

## Docker

```bash
docker compose up --build
```

## Configuration
Copy `.env.example` to `.env` and set production values.
