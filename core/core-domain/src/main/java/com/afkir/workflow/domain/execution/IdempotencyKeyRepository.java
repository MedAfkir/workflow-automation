package com.afkir.workflow.domain.execution;

import java.time.Instant;
import java.util.Optional;

public interface IdempotencyKeyRepository {
    IdempotencyRecord save(IdempotencyRecord record);

    Optional<IdempotencyRecord> findByKey(String key);

    int deleteExpired(Instant now);   
}