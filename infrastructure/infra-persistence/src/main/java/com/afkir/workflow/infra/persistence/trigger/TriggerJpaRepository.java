package com.afkir.workflow.infra.persistence.trigger;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TriggerJpaRepository extends JpaRepository<TriggerEntity, UUID> {

    Optional<TriggerEntity> findByWebhookKey(String key);

    List<TriggerEntity> findByWorkflowId(UUID workflowId);

    void deleteByWorkflowId(UUID workflowId);

    @Query("""
            SELECT t FROM TriggerEntity t
            WHERE t.enabled = true
              AND t.webhookKey IS NULL
              AND (t.nextEvaluationAt IS NULL OR t.nextEvaluationAt <= :now)
            ORDER BY t.nextEvaluationAt ASC NULLS FIRST
            """)
    List<TriggerEntity> findReadyToEvaluate(@Param("now") Instant now,
                                            org.springframework.data.domain.Pageable pageable);
}
