package com.afkir.workflow.infra.persistence.log;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LogJpaRepository extends JpaRepository<LogEntity, Long> {

    List<LogEntity> findByExecutionIdAndIdGreaterThanOrderByIdAsc(
            UUID executionId, long sinceId, Limit limit);
}
