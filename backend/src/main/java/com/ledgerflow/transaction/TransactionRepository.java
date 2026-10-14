package com.ledgerflow.transaction;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Page<Transaction> findByInitiatorUserId(Long userId, Pageable pageable);
    List<Transaction> findBySourceWalletIdOrTargetWalletId(Long sourceWalletId, Long targetWalletId);
    boolean existsByTransactionRef(String transactionRef);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Transaction t where t.id = :id")
    java.util.Optional<Transaction> findByIdForUpdate(@Param("id") Long id);
}
