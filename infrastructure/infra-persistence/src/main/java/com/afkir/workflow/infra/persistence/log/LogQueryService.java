package com.afkir.workflow.infra.persistence.log;

import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.log.LogEvent;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LogQueryService {

    private static final int MAX_BACKLOG_PAGE = 1000;

    private final LogJpaRepository repository;

    public LogQueryService(LogJpaRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<LogEvent> findSince(ExecutionId executionId, long sinceId) {
        return repository
                .findByExecutionIdAndIdGreaterThanOrderByIdAsc(
                        executionId.value(), sinceId, Limit.of(MAX_BACKLOG_PAGE))
                .stream()
                .map(e -> new LogEvent(
                        e.getId(),
                        new ExecutionId(e.getExecutionId()),
                        e.getTaskRunId(),
                        e.getLevel(),
                        e.getMessage(),
                        e.getLoggedAt()))
                .toList();
    }
}
