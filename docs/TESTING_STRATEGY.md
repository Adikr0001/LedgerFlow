# Testing Strategy

Use unit tests for validation and service logic, Spring Boot integration tests for controllers, and Docker-backed Testcontainers when available for PostgreSQL, Redis, and Kafka. Local verification in this environment uses the H2 profile because Docker is unavailable.
