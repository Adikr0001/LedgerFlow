package com.ledgerflow;

import com.ledgerflow.common.exception.ConflictException;
import com.ledgerflow.common.exception.InsufficientFundsException;
import com.ledgerflow.ledger.LedgerEntry;
import com.ledgerflow.ledger.LedgerEntryRepository;
import com.ledgerflow.ledger.LedgerEntryType;
import com.ledgerflow.transaction.Transaction;
import com.ledgerflow.transaction.TransactionRepository;
import com.ledgerflow.transaction.TransactionService;
import com.ledgerflow.transaction.TransactionType;
import com.ledgerflow.transaction.TransferRequest;
import com.ledgerflow.user.User;
import com.ledgerflow.user.UserRepository;
import com.ledgerflow.wallet.Wallet;
import com.ledgerflow.wallet.WalletRepository;
import com.ledgerflow.wallet.WalletService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.function.IntFunction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class LedgerFlowConcurrencyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private WalletService walletService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private LedgerEntryRepository ledgerEntryRepository;

    @Test
    void concurrentTransfersCannotSpendMoreThanWalletBalance()
        throws Exception {
        User sourceUser = registerUser("source");
        User targetUser = registerUser("target");
        Wallet source = walletService.createWallet(sourceUser.getId(), "USD");
        Wallet target = walletService.createWallet(targetUser.getId(), "USD");
        walletService.deposit(sourceUser.getId(), source.getId(), new BigDecimal("100.00"), "USD", "seed-" + UUID.randomUUID());

        int successCount = runConcurrent(20, index -> {
            try {
                transactionService.transfer(sourceUser.getId(), new TransferRequest(
                    source.getId(), target.getId(), new BigDecimal("10.00"), "USD", "spend-" + index + "-" + UUID.randomUUID()));
                return true;
            } catch (InsufficientFundsException expected) {
                return false;
            }
        });

        assertThat(successCount).isEqualTo(10);
        assertThat(walletRepository.findById(source.getId()).orElseThrow().getBalance())
            .isEqualByComparingTo("0.00");
        assertThat(walletRepository.findById(target.getId()).orElseThrow().getBalance())
            .isEqualByComparingTo("100.00");
    }

    @Test
    void concurrentOppositeTransfersCompleteWithoutDeadlockOrValueCreation()
        throws Exception {
        User userA = registerUser("opposite-a");
        User userB = registerUser("opposite-b");
        Wallet walletA = walletService.createWallet(userA.getId(), "USD");
        Wallet walletB = walletService.createWallet(userB.getId(), "USD");
        walletService.deposit(userA.getId(), walletA.getId(), new BigDecimal("100.00"), "USD", "seed-a-" + UUID.randomUUID());
        walletService.deposit(userB.getId(), walletB.getId(), new BigDecimal("100.00"), "USD", "seed-b-" + UUID.randomUUID());

        int successCount = runConcurrent(20, index -> {
            boolean aToB = index % 2 == 0;
            Long sourceWallet = aToB ? walletA.getId() : walletB.getId();
            Long targetWallet = aToB ? walletB.getId() : walletA.getId();
            Long initiator = aToB ? userA.getId() : userB.getId();
            try {
                transactionService.transfer(initiator, new TransferRequest(
                    sourceWallet, targetWallet, new BigDecimal("1.00"), "USD", "opposite-" + index + "-" + UUID.randomUUID()));
                return true;
            } catch (InsufficientFundsException unexpected) {
                return false;
            }
        });

        assertThat(successCount).isEqualTo(20);
        BigDecimal balanceA = walletRepository.findById(walletA.getId()).orElseThrow().getBalance();
        BigDecimal balanceB = walletRepository.findById(walletB.getId()).orElseThrow().getBalance();
        assertThat(balanceA).isEqualByComparingTo("100.00");
        assertThat(balanceB).isEqualByComparingTo("100.00");
        assertThat(balanceA.add(balanceB)).isEqualByComparingTo("200.00");
    }

    @Test
    void transferRejectsMismatchedWalletCurrencies() throws Exception {
        User sourceUser = registerUser("currency-source");
        User targetUser = registerUser("currency-target");
        Wallet source = walletService.createWallet(sourceUser.getId(), "USD");
        Wallet target = walletService.createWallet(targetUser.getId(), "EUR");

        assertThatThrownBy(() -> transactionService.transfer(sourceUser.getId(), new TransferRequest(
            source.getId(), target.getId(), new BigDecimal("1.00"), "USD", "currency-check-" + UUID.randomUUID())))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("currency must match");
        assertThat(walletRepository.findById(source.getId()).orElseThrow().getBalance())
            .isEqualByComparingTo("0.00");
        assertThat(walletRepository.findById(target.getId()).orElseThrow().getBalance())
            .isEqualByComparingTo("0.00");
    }

    @Test
    void concurrentReversalsCanOnlyReverseOriginalTransactionOnce()
        throws Exception {
        User sourceUser = registerUser("reversal-source");
        User targetUser = registerUser("reversal-target");
        Wallet source = walletService.createWallet(sourceUser.getId(), "USD");
        Wallet target = walletService.createWallet(targetUser.getId(), "USD");
        walletService.deposit(sourceUser.getId(), source.getId(), new BigDecimal("100.00"), "USD", "seed-reversal-" + UUID.randomUUID());
        Transaction original = transactionService.transfer(sourceUser.getId(), new TransferRequest(
            source.getId(), target.getId(), new BigDecimal("25.00"), "USD", "original-" + UUID.randomUUID()));

        int successCount = runConcurrent(2, index -> {
            try {
                transactionService.reverse(sourceUser.getId(), original.getId(), "reverse-" + index + "-" + UUID.randomUUID());
                return true;
            } catch (ConflictException expected) {
                return false;
            }
        });

        assertThat(successCount).isEqualTo(1);
        assertThat(walletRepository.findById(source.getId()).orElseThrow().getBalance())
            .isEqualByComparingTo("100.00");
        assertThat(walletRepository.findById(target.getId()).orElseThrow().getBalance())
            .isEqualByComparingTo("0.00");

        Transaction reversal = transactionRepository.findByOriginalTransactionId(original.getId()).orElseThrow();
        List<LedgerEntry> reversalEntries = ledgerEntryRepository.findByTransactionId(reversal.getId());
        assertThat(reversalEntries).hasSize(2);
        assertThat(reversalEntries)
            .extracting(LedgerEntry::getEntryType)
            .containsExactlyInAnyOrder(LedgerEntryType.CREDIT, LedgerEntryType.DEBIT);
        assertThat(reversalEntries)
            .allSatisfy(entry -> assertThat(entry.getAmount()).isEqualByComparingTo("25.00"));
    }

    @Test
    void reversalRetryWithSameKeyReturnsOriginalReversalAndDepositsCannotBeReversed()
        throws Exception {
        User sourceUser = registerUser("retry-source");
        User targetUser = registerUser("retry-target");
        Wallet source = walletService.createWallet(sourceUser.getId(), "USD");
        Wallet target = walletService.createWallet(targetUser.getId(), "USD");
        walletService.deposit(sourceUser.getId(), source.getId(), new BigDecimal("100.00"), "USD", "seed-retry-" + UUID.randomUUID());
        Transaction original = transactionService.transfer(sourceUser.getId(), new TransferRequest(
            source.getId(), target.getId(), new BigDecimal("25.00"), "USD", "retry-transfer-" + UUID.randomUUID()));

        String reversalKey = "reversal-retry-" + UUID.randomUUID();
        Transaction firstReversal = transactionService.reverse(sourceUser.getId(), original.getId(), reversalKey);
        Transaction replayedReversal = transactionService.reverse(sourceUser.getId(), original.getId(), reversalKey);

        assertThat(replayedReversal.getId()).isEqualTo(firstReversal.getId());
        assertThatThrownBy(() -> transactionService.reverse(sourceUser.getId(), original.getId(), "different-key-" + UUID.randomUUID()))
            .isInstanceOf(ConflictException.class);

        Transaction deposit = transactionRepository.findAll().stream()
            .filter(tx -> tx.getInitiatorUserId().equals(sourceUser.getId()) && tx.getType() == TransactionType.DEPOSIT)
            .findFirst()
            .orElseThrow();
        assertThatThrownBy(() -> transactionService.reverse(sourceUser.getId(), deposit.getId(), "deposit-reversal-" + UUID.randomUUID()))
            .isInstanceOf(ConflictException.class);
    }

    private User registerUser(String prefix) throws Exception {
        String suffix = UUID.randomUUID().toString();
        String username = prefix + "-" + suffix;
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + username + "\",\"email\":\"" + suffix + "@example.com\",\"password\":\"secret123\"}"))
            .andExpect(status().isOk());
        return userRepository.findByUsername(username).orElseThrow();
    }

    private int runConcurrent(int taskCount, IntFunction<Boolean> operation)
        throws InterruptedException, ExecutionException, TimeoutException {
        ExecutorService executor = Executors.newFixedThreadPool(taskCount);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Boolean>> results = new ArrayList<>(taskCount);
        try {
            for (int i = 0; i < taskCount; i++) {
                int index = i;
                results.add(executor.submit(() -> {
                    start.await();
                    return operation.apply(index);
                }));
            }
            start.countDown();
            int successes = 0;
            for (Future<Boolean> result : results) {
                if (result.get(30, TimeUnit.SECONDS)) {
                    successes++;
                }
            }
            return successes;
        } finally {
            executor.shutdownNow();
        }
    }
}
