package com.ledgerflow.idempotency;

import com.ledgerflow.common.exception.ConflictException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IdempotencyService {
    private final IdempotencyKeyRepository repository;
    private final ObjectMapper objectMapper;

    public IdempotencyService(IdempotencyKeyRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public boolean ensureUnique(Long userId, String operationKey, String requestHash, String operationName) {
        if (operationKey == null || operationKey.isBlank()) {
            return true;
        }
        IdempotencyKey existing = repository.findByUserIdAndOperationKey(userId, operationKey).orElse(null);
        if (existing == null) {
            IdempotencyKey key = new IdempotencyKey();
            key.setUserId(userId);
            key.setOperationKey(operationKey);
            key.setRequestHash(requestHash);
            key.setStatus("COMPLETED");
            key.setResponseJson("{}");
            repository.save(key);
            return true;
        }
        if (!existing.getRequestHash().equals(requestHash)) {
            throw new ConflictException("Idempotency key already used with a different payload for " + operationName);
        }
        return false;
    }

    public String serialize(Object data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Unable to serialize response", e);
        }
    }
}
