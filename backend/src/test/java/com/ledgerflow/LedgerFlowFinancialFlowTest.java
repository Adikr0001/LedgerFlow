package com.ledgerflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class LedgerFlowFinancialFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void financialWorkflowShouldCreateWalletsTransferFundsAndReversalShouldRestoreBalances() throws Exception {
        String userA = "alice-" + UUID.randomUUID();
        String userB = "bob-" + UUID.randomUUID();
        String tokenA = registerAndGetToken(userA, "alice." + UUID.randomUUID() + "@example.com", "secret123");
        String tokenB = registerAndGetToken(userB, "bob." + UUID.randomUUID() + "@example.com", "secret123");

        Long walletA = createWallet(tokenA, "USD");
        Long walletB = createWallet(tokenB, "USD");

        deposit(tokenA, walletA, "100.00", "USD", "dep-1");
        deposit(tokenB, walletB, "50.00", "USD", "dep-2");

        assertBalance(tokenA, walletA, "100.00");
        assertBalance(tokenB, walletB, "50.00");

        createTransfer(tokenA, walletA, walletB, "25.00", "USD", "transfer-1");

        assertBalance(tokenA, walletA, "75.00");
        assertBalance(tokenB, walletB, "75.00");

        mockMvc.perform(post("/api/v1/transfers")
                .header("Authorization", "Bearer " + tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sourceWalletId\":\"" + walletA + "\",\"targetWalletId\":\"" + walletB + "\",\"amount\":\"25.00\",\"currency\":\"USD\",\"idempotencyKey\":\"transfer-1\"}"))
            .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/transfers")
                .header("Authorization", "Bearer " + tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sourceWalletId\":\"" + walletA + "\",\"targetWalletId\":\"" + walletB + "\",\"amount\":\"10.00\",\"currency\":\"USD\",\"idempotencyKey\":\"transfer-1\"}"))
            .andExpect(status().isConflict());

        Long transferId = fetchLatestTransactionId(tokenA);
        reverseTransfer(tokenA, transferId, "reversal-1");

        assertBalance(tokenA, walletA, "100.00");
        assertBalance(tokenB, walletB, "50.00");

        String txStatus = fetchTransactionStatus(tokenA, transferId);
        assertThat(txStatus).isEqualTo("REVERSED");
    }

    private String registerAndGetToken(String username, String email, String password) throws Exception {
        String content = "{\"username\":\"" + username + "\",\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
        String response = mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(content))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode node = objectMapper.readTree(response);
        return node.path("data").path("token").asText();
    }

    private Long createWallet(String token, String currency) throws Exception {
        String response = mockMvc.perform(post("/api/v1/wallets")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currency\":\"" + currency + "\"}"))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode node = objectMapper.readTree(response);
        return node.path("data").path("walletId").asLong();
    }

    private void deposit(String token, Long walletId, String amount, String currency, String idempotencyKey) throws Exception {
        mockMvc.perform(post("/api/v1/wallets/{walletId}/deposits", walletId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\":\"" + amount + "\",\"currency\":\"" + currency + "\",\"idempotencyKey\":\"" + idempotencyKey + "\"}"))
            .andExpect(status().isOk());
    }

    private void createTransfer(String token, Long sourceWalletId, Long targetWalletId, String amount, String currency, String idempotencyKey) throws Exception {
        mockMvc.perform(post("/api/v1/transfers")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sourceWalletId\":\"" + sourceWalletId + "\",\"targetWalletId\":\"" + targetWalletId + "\",\"amount\":\"" + amount + "\",\"currency\":\"" + currency + "\",\"idempotencyKey\":\"" + idempotencyKey + "\"}"))
            .andExpect(status().isOk());
    }

    private void assertBalance(String token, Long walletId, String expected) throws Exception {
        String response = mockMvc.perform(get("/api/v1/wallets/{walletId}/balance", walletId)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode node = objectMapper.readTree(response);
        assertThat(new BigDecimal(node.path("data").path("balance").asText())).isEqualByComparingTo(new BigDecimal(expected));
    }

    private Long fetchLatestTransactionId(String token) throws Exception {
        String response = mockMvc.perform(get("/api/v1/transactions")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode node = objectMapper.readTree(response);
        JsonNode content = node.path("data").path("content");
        return content.get(content.size() - 1).path("id").asLong();
    }

    private void reverseTransfer(String token, Long transactionId, String idempotencyKey) throws Exception {
        mockMvc.perform(post("/api/v1/transactions/{transactionId}/reversals", transactionId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"idempotencyKey\":\"" + idempotencyKey + "\"}"))
            .andExpect(status().isOk());
    }

    private String fetchTransactionStatus(String token, Long id) throws Exception {
        String response = mockMvc.perform(get("/api/v1/transactions/{transactionId}", id)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode node = objectMapper.readTree(response);
        return node.path("data").path("status").asText();
    }
}
