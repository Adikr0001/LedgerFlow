package com.ledgerflow.transaction;

import com.ledgerflow.common.response.ApiResponse;
import com.ledgerflow.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class TransactionController {
    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/transfers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createTransfer(@AuthenticationPrincipal UserPrincipal principal,
                                                                          @RequestBody TransferRequest request) {
        Transaction tx = transactionService.transfer(principal.getUser().getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Transfer accepted", Map.of("transactionId", tx.getId(), "status", tx.getStatus(), "amount", tx.getAmount().toPlainString())));
    }

    @GetMapping("/transactions/{transactionId}")
    public ResponseEntity<ApiResponse<Transaction>> getTransaction(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long transactionId) {
        return ResponseEntity.ok(ApiResponse.success("Transaction found", transactionService.getForUser(principal.getUser().getId(), transactionId)));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<Transaction>>> getTransactions(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success("Transactions fetched", transactionService.list(principal.getUser().getId(), pageable)));
    }

    @PostMapping("/transactions/{transactionId}/reversals")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reverse(@AuthenticationPrincipal UserPrincipal principal,
                                                                    @PathVariable Long transactionId,
                                                                    @RequestBody ReversalRequest request) {
        Transaction tx = transactionService.reverse(principal.getUser().getId(), transactionId, request.idempotencyKey());
        return ResponseEntity.ok(ApiResponse.success("Reversal processed", Map.of("transactionId", tx.getId(), "status", tx.getStatus())));
    }

    public record ReversalRequest(String idempotencyKey) {}
}
