package com.ledgerflow.transaction;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Page<Transaction> findByInitiatorUserId(Long userId, Pageable pageable);
    List<Transaction> findBySourceWalletIdOrTargetWalletId(Long sourceWalletId, Long targetWalletId);
    boolean existsByTransactionRef(String transactionRef);
}
