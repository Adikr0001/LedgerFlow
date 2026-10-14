package com.ledgerflow.reconciliation;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "reconciliation_reports")
public class ReconciliationReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_ref", nullable = false, unique = true)
    private String reportRef;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String discrepancies;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ReconciliationReport() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getReportRef() { return reportRef; }
    public void setReportRef(String reportRef) { this.reportRef = reportRef; }
    public String getDiscrepancies() { return discrepancies; }
    public void setDiscrepancies(String discrepancies) { this.discrepancies = discrepancies; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
