package com.ledgerflow.audit;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_events")
public class AuditEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "actor_user_id")
    private Long actorUserId;

    @Column(name = "wallet_id")
    private Long walletId;

    @Column(name = "transaction_id")
    private Long transactionId;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public AuditEvent() {}

    public AuditEvent(String eventType, Long actorUserId, Long walletId, Long transactionId, String payload) {
        this.eventType = eventType;
        this.actorUserId = actorUserId;
        this.walletId = walletId;
        this.transactionId = transactionId;
        this.payload = payload;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public Long getActorUserId() { return actorUserId; }
    public void setActorUserId(Long actorUserId) { this.actorUserId = actorUserId; }
    public Long getWalletId() { return walletId; }
    public void setWalletId(Long walletId) { this.walletId = walletId; }
    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }
    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
