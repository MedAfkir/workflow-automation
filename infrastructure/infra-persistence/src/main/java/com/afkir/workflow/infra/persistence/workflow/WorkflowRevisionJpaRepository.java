package com.afkir.workflow.infra.persistence.workflow;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkflowRevisionJpaRepository extends JpaRepository<WorkflowRevisionEntity, UUID> {

    @Query("SELECT MAX(r.revision) FROM WorkflowRevisionEntity r WHERE r.workflowId = :workflowId")
    Optional<Integer> findMaxRevisionByWorkflowId(@Param("workflowId") UUID workflowId);

    List<WorkflowRevisionEntity> findByWorkflowIdOrderByRevisionDesc(UUID workflowId);

    Optional<WorkflowRevisionEntity> findByWorkflowIdAndRevision(UUID workflowId, int revision);
}
