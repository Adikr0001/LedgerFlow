package com.ledgerflow.transaction;

import com.ledgerflow.audit.AuditEvent;
import com.ledgerflow.audit.AuditEventRepository;
import com.ledgerflow.common.exception.ConflictException;
import com.ledgerflow.common.exception.InsufficientFundsException;
import com.ledgerflow.common.exception.ResourceNotFoundException;
import com.ledgerflow.idempotency.IdempotencyService;
import com.ledgerflow.ledger.LedgerEntry;
import com.ledgerflow.ledger.LedgerEntryRepository;
import com.ledgerflow.ledger.LedgerEntryType;
import com.ledgerflow.notification.NotificationMessageService;
import com.ledgerflow.wallet.Wallet;
import com.ledgerflow.wallet.WalletRepository;
import com.ledgerflow.wallet.WalletService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Service
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final AuditEventRepository auditEventRepository;
    private final NotificationMessageService notificationMessageService;
    private final IdempotencyService idempotencyService;
    private final WalletService walletService;

    public TransactionService(TransactionRepository transactionRepository,
                             WalletRepository walletRepository,
                             LedgerEntryRepository ledgerEntryRepository,
                             AuditEventRepository auditEventRepository,
                             NotificationMessageService notificationMessageService,
                             IdempotencyService idempotencyService,
                             WalletService walletService) {
        this.transactionRepository = transactionRepository;
        this.walletRepository = walletRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.auditEventRepository = auditEventRepository;
        this.notificationMessageService = notificationMessageService;
        this.idempotencyService = idempotencyService;
        this.walletService = walletService;
    }

    @Transactional
    public Transaction transfer(Long userId, TransferRequest request) {
        if (request == null || request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transfer amount must be greater than zero");
        }
        if (Objects.equals(request.sourceWalletId(), request.targetWalletId())) {
            throw new IllegalArgumentException("Self-transfers are not allowed");
        }

        WalletPair wallets = lockWalletPair(request.sourceWalletId(), request.targetWalletId());
        Wallet source = wallets.source();
        Wallet target = wallets.target();

        if (!source.getUserId().equals(userId)) {
            throw new SecurityException("User does not own the source wallet");
        }
        if (request.currency() == null || request.currency().isBlank()
            || !source.getCurrency().equalsIgnoreCase(request.currency())
            || !target.getCurrency().equalsIgnoreCase(request.currency())) {
            throw new ConflictException("Source wallet, destination wallet, and transfer currency must match");
        }
        if (source.getBalance().compareTo(request.amount()) < 0) {
            throw new InsufficientFundsException("Insufficient funds for transfer");
        }

        String requestHash = walletService.makeHash("transfer", request.sourceWalletId().toString(), request.targetWalletId().toString(), request.amount().toPlainString(), request.currency(), request.idempotencyKey());
        boolean isNewRequest = idempotencyService.ensureUnique(userId, request.idempotencyKey(), requestHash, "transfer");
        if (!isNewRequest) {
            return transactionRepository.findByInitiatorUserId(userId, Pageable.unpaged())
                .stream()
                .filter(tx -> tx.getSourceWalletId() != null && tx.getSourceWalletId().equals(request.sourceWalletId())
                    && tx.getTargetWalletId() != null && tx.getTargetWalletId().equals(request.targetWalletId())
                    && tx.getAmount().compareTo(request.amount()) == 0
                    && tx.getCurrency().equalsIgnoreCase(request.currency()))
                .findFirst()
                .orElseThrow(() -> new ConflictException("Duplicate idempotent transfer already exists"));
        }

        Transaction tx = new Transaction();
        tx.setTransactionRef("TX-" + System.nanoTime());
        tx.setType(TransactionType.TRANSFER);
        tx.setAmount(request.amount());
        tx.setCurrency(request.currency());
        tx.setSourceWalletId(source.getId());
        tx.setTargetWalletId(target.getId());
        tx.setInitiatorUserId(userId);
        tx.complete();
        tx = transactionRepository.save(tx);

        source.setBalance(source.getBalance().subtract(request.amount()));
        target.setBalance(target.getBalance().add(request.amount()));
        walletRepository.save(source);
        walletRepository.save(target);

        ledgerEntryRepository.save(new LedgerEntry(tx.getId(), source.getId(), LedgerEntryType.DEBIT, request.amount(), request.currency()));
        ledgerEntryRepository.save(new LedgerEntry(tx.getId(), target.getId(), LedgerEntryType.CREDIT, request.amount(), request.currency()));

        auditEventRepository.save(new AuditEvent("transfer.completed", userId, source.getId(), tx.getId(), "debit to " + target.getId()));
        notificationMessageService.notifyUser(userId, tx.getId(), "Transfer sent: " + request.amount() + " " + request.currency());
        notificationMessageService.notifyUser(target.getUserId(), tx.getId(), "Incoming funds: " + request.amount() + " " + request.currency());

        return tx;
    }

    public Page<Transaction> list(Long userId, Pageable pageable) {
        return transactionRepository.findByInitiatorUserId(userId, pageable);
    }

    public Transaction getForUser(Long userId, Long transactionId) {
        Transaction tx = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        if (!tx.getInitiatorUserId().equals(userId)) {
            throw new SecurityException("User does not own transaction");
        }
        return tx;
    }

    @Transactional
    public Transaction reverse(Long userId, Long transactionId, String idempotencyKey) {
        Transaction original = transactionRepository.findByIdForUpdate(transactionId)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        if (!original.getInitiatorUserId().equals(userId)) {
            throw new SecurityException("User cannot reverse this transaction");
        }
        if (original.getType() != TransactionType.TRANSFER) {
            throw new ConflictException("Only transfers can be reversed");
        }
        String requestHash = walletService.makeHash("reversal", transactionId.toString(), idempotencyKey);
        boolean isNewRequest = idempotencyService.ensureUnique(userId, idempotencyKey, requestHash, "reversal");
        if (!isNewRequest) {
            return transactionRepository.findByOriginalTransactionId(transactionId)
                .orElseThrow(() -> new ConflictException("Idempotent reversal is not yet available"));
        }
        if (original.getStatus() != TransactionStatus.COMPLETED) {
            throw new ConflictException("Only completed transfers can be reversed");
        }

        WalletPair wallets = lockWalletPair(original.getSourceWalletId(), original.getTargetWalletId());
        Wallet source = wallets.source();
        Wallet target = wallets.target();

        if (target.getBalance().compareTo(original.getAmount()) < 0) {
            throw new InsufficientFundsException("Reversal would create a negative balance; admin review required");
        }

        Transaction reversal = new Transaction();
        reversal.setTransactionRef("REV-" + System.nanoTime());
        reversal.setType(TransactionType.REVERSAL);
        reversal.setAmount(original.getAmount());
        reversal.setCurrency(original.getCurrency());
        reversal.setSourceWalletId(original.getTargetWalletId());
        reversal.setTargetWalletId(original.getSourceWalletId());
        reversal.setInitiatorUserId(userId);
        reversal.setOriginalTransactionId(original.getId());
        reversal.complete();
        reversal = transactionRepository.save(reversal);

        source.setBalance(source.getBalance().add(original.getAmount()));
        target.setBalance(target.getBalance().subtract(original.getAmount()));
        walletRepository.save(source);
        walletRepository.save(target);

        ledgerEntryRepository.save(new LedgerEntry(reversal.getId(), source.getId(), LedgerEntryType.CREDIT, original.getAmount(), original.getCurrency()));
        ledgerEntryRepository.save(new LedgerEntry(reversal.getId(), target.getId(), LedgerEntryType.DEBIT, original.getAmount(), original.getCurrency()));
        original.markReversed();
        transactionRepository.save(original);

        auditEventRepository.save(new AuditEvent("transfer.reversed", userId, source.getId(), reversal.getId(), "reversed tx=" + original.getId()));
        notificationMessageService.notifyUser(userId, reversal.getId(), "Reversal processed for transaction " + original.getId());
        return reversal;
    }

    private WalletPair lockWalletPair(Long sourceWalletId, Long targetWalletId) {
        Long firstId = Math.min(sourceWalletId, targetWalletId);
        Long secondId = Math.max(sourceWalletId, targetWalletId);
        Wallet first = walletRepository.findByIdForUpdate(firstId)
            .orElseThrow(() -> new ResourceNotFoundException("Wallet not found: " + firstId));
        Wallet second = walletRepository.findByIdForUpdate(secondId)
            .orElseThrow(() -> new ResourceNotFoundException("Wallet not found: " + secondId));
        return sourceWalletId.equals(firstId)
            ? new WalletPair(first, second)
            : new WalletPair(second, first);
    }

    private record WalletPair(Wallet source, Wallet target) {}
}
