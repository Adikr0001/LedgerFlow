# Testing Strategy

Use unit tests for validation and service logic, Spring Boot integration tests for controllers, and Docker-backed Testcontainers when available for PostgreSQL, Redis, and Kafka. Local verification in this environment uses the H2 profile because Docker is unavailable.

The concurrency integration tests execute transfers and reversals from parallel threads against the application database. They verify that concurrent transfers cannot overspend, transfers in opposite directions do not deadlock, total wallet value is conserved, and an original transaction can only be reversed once. Run them with `mvn -Dtest=LedgerFlowConcurrencyTest test`.
