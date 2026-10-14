# High-Level Design

LedgerFlow is a modular monolith organized by domain package. PostgreSQL is the system of record for accounts, ledger entries, idempotency and audit data. Redis supports rate limiting and temporary operational state. Kafka publishes transaction events asynchronously via a DB outbox pattern to reduce duplicates.

## Components
- API layer: controllers and DTO validation.
- Service layer: business policy, transfers, idempotency, reversal.
- Persistence layer: JPA repositories and Flyway-managed schema.
- Messaging layer: outbox publisher and Kafka topic.
- Security layer: JWT with role checks.
