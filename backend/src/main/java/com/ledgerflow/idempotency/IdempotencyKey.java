package com.ledgerflow.idempotency;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "idempotency_keys", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "operation_key"}))
public class IdempotencyKey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "operation_key", nullable = false)
    private String operationKey;

    @Column(name = "request_hash", nullable = false)
    private String requestHash;

    @Column(name = "response_json", nullable = false, columnDefinition = "TEXT")
    private String responseJson;

    @Column(nullable = false)
    private String status = "COMPLETED";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public IdempotencyKey() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getOperationKey() { return operationKey; }
    public void setOperationKey(String operationKey) { this.operationKey = operationKey; }
    public String getRequestHash() { return requestHash; }
    public void setRequestHash(String requestHash) { this.requestHash = requestHash; }
    public String getResponseJson() { return responseJson; }
    public void setResponseJson(String responseJson) { this.responseJson = responseJson; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
