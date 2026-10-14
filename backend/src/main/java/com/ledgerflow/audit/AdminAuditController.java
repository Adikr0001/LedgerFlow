package com.ledgerflow.audit;

import com.ledgerflow.common.response.ApiResponse;
import com.ledgerflow.reconciliation.ReconciliationReport;
import com.ledgerflow.reconciliation.ReconciliationRepository;
import com.ledgerflow.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {
    private final AuditEventRepository auditEventRepository;
    private final ReconciliationRepository reconciliationRepository;

    public AdminAuditController(AuditEventRepository auditEventRepository, ReconciliationRepository reconciliationRepository) {
        this.auditEventRepository = auditEventRepository;
        this.reconciliationRepository = reconciliationRepository;
    }

    @GetMapping("/audit-events")
    public ResponseEntity<ApiResponse<List<AuditEvent>>> auditEvents(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Audit events loaded", auditEventRepository.findAll()));
    }

    @GetMapping("/reconciliation")
    public ResponseEntity<ApiResponse<List<ReconciliationReport>>> reconciliation(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Reconciliation reports loaded", reconciliationRepository.findAll()));
    }
}
