package com.afkir.workflow.infra.persistence.execution;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ExecutionJpaRepository extends JpaRepository<ExecutionEntity, UUID> {

    List<ExecutionEntity> findByWorkflowIdOrderByCreatedAtDesc(UUID workflowId);

    List<ExecutionEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<ExecutionEntity> findByStateOrderByCreatedAtDesc(String state, Pageable pageable);
}
