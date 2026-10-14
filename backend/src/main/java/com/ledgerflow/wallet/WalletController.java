package com.ledgerflow.wallet;

import com.ledgerflow.common.response.ApiResponse;
import com.ledgerflow.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class WalletController {
    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @PostMapping("/wallets")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createWallet(@AuthenticationPrincipal UserPrincipal principal,
                                                                          @Valid @RequestBody CreateWalletRequest request) {
        Wallet wallet = walletService.createWallet(principal.getUser().getId(), request.currency());
        return ResponseEntity.ok(ApiResponse.success("Wallet created", Map.of("walletId", wallet.getId(), "currency", wallet.getCurrency(), "balance", wallet.getBalance())));
    }

    @GetMapping("/wallets")
    public ResponseEntity<ApiResponse<List<Wallet>>> getWallets(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Wallets fetched", walletService.listWallets(principal.getUser().getId())));
    }

    @GetMapping("/wallets/{walletId}")
    public ResponseEntity<ApiResponse<Wallet>> getWallet(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long walletId) {
        Wallet wallet = walletService.getAuthorizedWallet(principal.getUser().getId(), walletId);
        return ResponseEntity.ok(ApiResponse.success("Wallet found", wallet));
    }

    @GetMapping("/wallets/{walletId}/balance")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBalance(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long walletId) {
        BigDecimal balance = walletService.getBalance(principal.getUser().getId(), walletId);
        return ResponseEntity.ok(ApiResponse.success("Balance fetched", Map.of("walletId", walletId, "balance", balance)));
    }

    @PostMapping("/wallets/{walletId}/deposits")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deposit(@AuthenticationPrincipal UserPrincipal principal,
                                                                   @PathVariable Long walletId,
                                                                   @Valid @RequestBody DepositRequest request) {
        Wallet wallet = walletService.deposit(principal.getUser().getId(), walletId, request.amount(), request.currency(), request.idempotencyKey());
        return ResponseEntity.ok(ApiResponse.success("Deposit processed", Map.of("walletId", wallet.getId(), "balance", wallet.getBalance())));
    }

    public record CreateWalletRequest(String currency) {}
    public record DepositRequest(BigDecimal amount, String currency, String idempotencyKey) {}
}
