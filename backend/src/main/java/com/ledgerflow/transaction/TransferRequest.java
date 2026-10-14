package com.ledgerflow.transaction;

import java.math.BigDecimal;

public record TransferRequest(Long sourceWalletId, Long targetWalletId, BigDecimal amount, String currency, String idempotencyKey) {
}
