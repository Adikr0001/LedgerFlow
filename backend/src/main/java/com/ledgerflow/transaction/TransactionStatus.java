package com.ledgerflow.transaction;

public enum TransactionStatus {
    PENDING,
    COMPLETED,
    REVERSED,
    FAILED,
    REVERSED_PENDING_REVIEW
}
