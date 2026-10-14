package com.ledgerflow.reconciliation;

import com.ledgerflow.audit.AuditEvent;
import com.ledgerflow.audit.AuditEventRepository;
import com.ledgerflow.ledger.LedgerEntry;
import com.ledgerflow.ledger.LedgerEntryRepository;
import com.ledgerflow.wallet.Wallet;
import com.ledgerflow.wallet.WalletRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReconciliationService {
    private final WalletRepository walletRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final ReconciliationRepository reconciliationRepository;
    private final AuditEventRepository auditEventRepository;

    public ReconciliationService(WalletRepository walletRepository,
                                 LedgerEntryRepository ledgerEntryRepository,
                                 ReconciliationRepository reconciliationRepository,
                                 AuditEventRepository auditEventRepository) {
        this.walletRepository = walletRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.reconciliationRepository = reconciliationRepository;
        this.auditEventRepository = auditEventRepository;
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void reconcile() {
        List<String> discrepancies = new ArrayList<>();
        List<Wallet> wallets = walletRepository.findAll();
        for (Wallet wallet : wallets) {
            BigDecimal ledgerTotal = BigDecimal.ZERO;
            List<LedgerEntry> entries = ledgerEntryRepository.findByWalletId(wallet.getId());
            for (LedgerEntry entry : entries) {
                if ("DEBIT".equals(entry.getEntryType().name())) {
                    ledgerTotal = ledgerTotal.subtract(entry.getAmount());
                } else {
                    ledgerTotal = ledgerTotal.add(entry.getAmount());
                }
            }
            if (!ledgerTotal.equals(wallet.getBalance())) {
                discrepancies.add("Wallet " + wallet.getId() + " ledger=" + ledgerTotal + " balance=" + wallet.getBalance());
            }
        }

        ReconciliationReport report = new ReconciliationReport();
        report.setReportRef("RC-" + System.currentTimeMillis());
        report.setDiscrepancies(discrepancies.isEmpty() ? "No discrepancies" : String.join("; ", discrepancies));
        report.setStatus(discrepancies.isEmpty() ? "OK" : "DISCREPANCY");
        reconciliationRepository.save(report);

        if (!discrepancies.isEmpty()) {
            auditEventRepository.save(new AuditEvent("reconciliation.discrepancy", null, null, null, report.getDiscrepancies()));
        }
    }
}
