package com.ledgerflow.transaction;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

public record TransferRequest(Long sourceWalletId, Long targetWalletId,
                              @Schema(implementation = String.class, format = "decimal", example = "12.34") BigDecimal amount,
                              String currency, String idempotencyKey) {
}
