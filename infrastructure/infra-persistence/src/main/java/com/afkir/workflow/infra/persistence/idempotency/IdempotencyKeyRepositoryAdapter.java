package com.afkir.workflow.infra.persistence.idempotency;

import com.afkir.workflow.domain.execution.IdempotencyKeyRepository;
import com.afkir.workflow.domain.execution.IdempotencyRecord;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Component
public class IdempotencyKeyRepositoryAdapter implements IdempotencyKeyRepository {

    private final IdempotencyJpaRepository jpa;

    public IdempotencyKeyRepositoryAdapter(IdempotencyJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    @Transactional
    public IdempotencyRecord save(IdempotencyRecord record) {
        var entity = new IdempotencyEntity(
                record.key(), record.namespace(), record.executionId(),
                record.createdAt(), record.expiresAt()
        );
        var saved = jpa.save(entity);
        return toDomain(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<IdempotencyRecord> findByKey(String key) {
        return jpa.findById(key).map(this::toDomain);
    }

    @Override
    @Transactional
    public int deleteExpired(Instant now) {
        return jpa.deleteExpired(now);
    }

    private IdempotencyRecord toDomain(IdempotencyEntity e) {
        return new IdempotencyRecord(
                e.getKey(), e.getNamespace(), e.getExecutionId(),
                e.getCreatedAt(), e.getExpiresAt()
        );
    }
}
