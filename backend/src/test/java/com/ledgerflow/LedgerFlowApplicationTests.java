package com.ledgerflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgerflow.transaction.Transaction;
import com.ledgerflow.wallet.Wallet;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@AutoConfigureMockMvc
class LedgerFlowApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void contextLoads() {
    }

    @Test
    void frontendOriginCanMakeAuthenticatedApiPreflightRequests() throws Exception {
        mockMvc.perform(options("/api/v1/transfers")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "authorization,content-type"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
            .andExpect(header().string("Access-Control-Allow-Headers", "authorization, content-type"));
    }

    @Test
    void financialAmountsAreSerializedAsExactDecimalStrings() throws Exception {
        Wallet wallet = new Wallet(1L, "USD");
        wallet.setBalance(new java.math.BigDecimal("90071992547409931234.56"));
        JsonNode walletJson = objectMapper.readTree(objectMapper.writeValueAsBytes(wallet));
        assertEquals("90071992547409931234.56", walletJson.get("balance").textValue());

        Transaction transaction = new Transaction();
        transaction.setAmount(new java.math.BigDecimal("90071992547409931234.56"));
        JsonNode transactionJson = objectMapper.readTree(objectMapper.writeValueAsBytes(transaction));
        assertEquals("90071992547409931234.56", transactionJson.get("amount").textValue());
    }

    @Test
    void openApiDocumentsFinancialAmountsAsDecimalStrings() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.components.schemas.Wallet.properties.balance.type").value("string"))
            .andExpect(jsonPath("$.components.schemas.Transaction.properties.amount.type").value("string"))
            .andExpect(jsonPath("$.components.schemas.DepositRequest.properties.amount.type").value("string"))
            .andExpect(jsonPath("$.components.schemas.TransferRequest.properties.amount.type").value("string"));
    }
}
