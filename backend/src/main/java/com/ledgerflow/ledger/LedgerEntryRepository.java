package com.ledgerflow.ledger;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {
    List<LedgerEntry> findByWalletId(Long walletId);
    List<LedgerEntry> findByTransactionId(Long transactionId);
}
