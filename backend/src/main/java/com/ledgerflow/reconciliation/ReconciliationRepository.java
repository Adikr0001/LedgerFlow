package com.ledgerflow.reconciliation;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReconciliationRepository extends JpaRepository<ReconciliationReport, Long> {
}
