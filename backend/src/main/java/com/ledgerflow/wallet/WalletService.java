package com.ledgerflow.wallet;

import com.ledgerflow.audit.AuditEvent;
import com.ledgerflow.audit.AuditEventRepository;
import com.ledgerflow.common.exception.InsufficientFundsException;
import com.ledgerflow.common.exception.ResourceNotFoundException;
import com.ledgerflow.idempotency.IdempotencyService;
import com.ledgerflow.ledger.LedgerEntry;
import com.ledgerflow.ledger.LedgerEntryRepository;
import com.ledgerflow.ledger.LedgerEntryType;
import com.ledgerflow.notification.NotificationMessageService;
import com.ledgerflow.transaction.Transaction;
import com.ledgerflow.transaction.TransactionRepository;
import com.ledgerflow.transaction.TransactionStatus;
import com.ledgerflow.transaction.TransactionType;
import com.ledgerflow.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Optional;

@Service
public class WalletService {
    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final AuditEventRepository auditEventRepository;
    private final IdempotencyService idempotencyService;
    private final NotificationMessageService notificationMessageService;
    private final ObjectMapper objectMapper;
    private final LedgerEntryRepository ledgerEntryRepository;

    public WalletService(WalletRepository walletRepository,
                        UserRepository userRepository,
                        TransactionRepository transactionRepository,
                        AuditEventRepository auditEventRepository,
                        IdempotencyService idempotencyService,
                        NotificationMessageService notificationMessageService,
                        ObjectMapper objectMapper,
                        LedgerEntryRepository ledgerEntryRepository) {
        this.walletRepository = walletRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.auditEventRepository = auditEventRepository;
        this.idempotencyService = idempotencyService;
        this.notificationMessageService = notificationMessageService;
        this.objectMapper = objectMapper;
        this.ledgerEntryRepository = ledgerEntryRepository;
    }

    public Wallet createWallet(Long userId, String currency) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found");
        }
        Wallet wallet = new Wallet(userId, Optional.ofNullable(currency).orElse("INR"));
        return walletRepository.save(wallet);
    }

    public List<Wallet> listWallets(Long userId) {
        return walletRepository.findByUserId(userId);
    }

    public Wallet getAuthorizedWallet(Long userId, Long walletId) {
        Wallet wallet = walletRepository.findById(walletId)
            .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        if (!wallet.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Wallet not owned by user");
        }
        return wallet;
    }

    public BigDecimal getBalance(Long userId, Long walletId) {
        Wallet wallet = getAuthorizedWallet(userId, walletId);
        return wallet.getBalance();
    }

    @Transactional
    public Wallet deposit(Long userId, Long walletId, BigDecimal amount, String currency, String idempotencyKey) {
        Wallet wallet = getAuthorizedWallet(userId, walletId);
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Deposit amount must be greater than zero");
        }
        String requestHash = makeHash("deposit", String.valueOf(walletId), amount.toPlainString(), currency, idempotencyKey);
        boolean isNewRequest = idempotencyService.ensureUnique(userId, idempotencyKey, requestHash, "wallet deposit");
        if (!isNewRequest) {
            return wallet;
        }

        wallet.setBalance(wallet.getBalance().add(amount));
        wallet.setUpdatedAt(java.time.Instant.now());
        Wallet saved = walletRepository.save(wallet);

        Transaction tx = new Transaction();
        tx.setTransactionRef("DEP-" + System.nanoTime());
        tx.setType(TransactionType.DEPOSIT);
        tx.setStatus(TransactionStatus.COMPLETED);
        tx.setAmount(amount);
        tx.setCurrency(currency);
        tx.setSourceWalletId(null);
        tx.setTargetWalletId(walletId);
        tx.setInitiatorUserId(userId);
        tx = transactionRepository.save(tx);

        ledgerEntryRepository.save(new LedgerEntry(tx.getId(), walletId, LedgerEntryType.CREDIT, amount, currency));
        auditEventRepository.save(new AuditEvent("wallet.deposit", userId, walletId, tx.getId(), MapToString.of("amount", amount, "currency", currency)));
        notificationMessageService.notifyUser(userId, tx.getId(), "Deposit received: " + amount + " " + currency);
        return saved;
    }

    public Wallet getWalletForUpdate(Long walletId) {
        return walletRepository.findByIdForUpdate(walletId)
            .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
    }

    public void validateSufficientFunds(Long walletId, BigDecimal amount) {
        Wallet wallet = walletRepository.findById(walletId)
            .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new InsufficientFundsException("Insufficient funds in wallet " + walletId);
        }
    }

    public String makeHash(String... values) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            StringBuilder builder = new StringBuilder();
            for (String value : values) {
                builder.append(value).append(':');
            }
            byte[] hash = digest.digest(builder.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Unable to hash request", e);
        }
    }

    public static class MapToString {
        public static String of(Object... values) {
            StringBuilder result = new StringBuilder("{");
            for (int i = 0; i < values.length; i += 2) {
                result.append(values[i]).append("=\"").append(values[i + 1]).append("\"");
                if (i + 2 < values.length) result.append(", ");
            }
            result.append("}");
            return result.toString();
        }
    }
}
