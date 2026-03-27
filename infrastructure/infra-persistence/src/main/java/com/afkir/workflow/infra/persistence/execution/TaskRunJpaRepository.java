package com.afkir.workflow.infra.persistence.execution;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskRunJpaRepository extends JpaRepository<TaskRunEntity, UUID> {

    List<TaskRunEntity> findByExecutionIdOrderBySequence(UUID executionId);
}
