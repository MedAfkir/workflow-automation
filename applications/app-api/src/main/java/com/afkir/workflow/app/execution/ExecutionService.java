package com.afkir.workflow.app.execution;

import com.afkir.workflow.engine.execution.ExecutionFactory;
import com.afkir.workflow.app.workflow.WorkflowNotFoundException;
import com.afkir.workflow.domain.execution.Execution;
import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.execution.ExecutionRepository;
import com.afkir.workflow.domain.execution.ExecutionState;
import com.afkir.workflow.domain.execution.IdempotencyKeyRepository;
import com.afkir.workflow.domain.execution.IdempotencyRecord;
import com.afkir.workflow.domain.execution.TaskRun;
import com.afkir.workflow.domain.execution.TaskRunRepository;
import com.afkir.workflow.domain.workflow.Workflow;
import com.afkir.workflow.domain.workflow.WorkflowId;
import com.afkir.workflow.domain.workflow.WorkflowRepository;
import com.afkir.workflow.domain.workflow.WorkflowRevision;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class ExecutionService {

    private static final Logger log = LoggerFactory.getLogger(ExecutionService.class);

    private final WorkflowRepository workflowRepository;
    private final ExecutionRepository executionRepository;
    private final TaskRunRepository taskRunRepository;
    private final IdempotencyKeyRepository idempotencyKeyRepository;
    private final ExecutionFactory executionFactory;

    public ExecutionService(WorkflowRepository workflowRepository,
                            ExecutionRepository executionRepository,
                            TaskRunRepository taskRunRepository,
                            IdempotencyKeyRepository idempotencyKeyRepository,
                            ExecutionFactory executionFactory) {
        this.workflowRepository = workflowRepository;
        this.executionRepository = executionRepository;
        this.taskRunRepository = taskRunRepository;
        this.idempotencyKeyRepository = idempotencyKeyRepository;
        this.executionFactory = executionFactory;
    }

    @Transactional
    public Execution createAndExecute(WorkflowId workflowId, Map<String, Object> inputs) {
        var workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new WorkflowNotFoundException(workflowId));

        var execution = executionFactory.fromManual(workflow, inputs);
        return executionRepository.save(execution);
    }

    @Transactional
    public Execution createIdempotent(WorkflowId workflowId, Map<String, Object> inputs,
                                      String idempotencyKey) {
        var workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new WorkflowNotFoundException(workflowId));
        var namespace = workflow.namespaceKey().fullName();
        var fullKey = namespace + ":" + idempotencyKey;

        var existing = idempotencyKeyRepository.findByKey(fullKey);
        if (existing.isPresent()) {
            log.info("Idempotency hit: returning existing execution {}",
                    existing.get().executionId());
            return executionRepository.findById(new ExecutionId(existing.get().executionId()))
                    .orElseThrow(() -> new ExecutionNotFoundException(
                            new ExecutionId(existing.get().executionId())));
        }

        var execution = createAndExecute(workflowId, inputs);

        var record = new IdempotencyRecord(
                fullKey, namespace, execution.id().value(),
                Instant.now(), Instant.now().plus(Duration.ofHours(24))
        );
        try {
            idempotencyKeyRepository.save(record);
        } catch (DataIntegrityViolationException e) {
            
            var concurrent = idempotencyKeyRepository.findByKey(fullKey)
                    .orElseThrow(() -> e);
            return executionRepository.findById(new ExecutionId(concurrent.executionId()))
                    .orElseThrow(() -> new ExecutionNotFoundException(
                            new ExecutionId(concurrent.executionId())));
        }

        return execution;
    }

    @Transactional(readOnly = true)
    public Execution findById(ExecutionId id) {
        return executionRepository.findById(id)
                .orElseThrow(() -> new ExecutionNotFoundException(id));
    }

    @Transactional(readOnly = true)
    public List<TaskRun> findTaskRuns(ExecutionId id) {
        return taskRunRepository.findByExecutionIdOrderBySequence(id);
    }

    @Transactional
    public Execution kill(ExecutionId id) {
        var execution = executionRepository.findById(id)
                .orElseThrow(() -> new ExecutionNotFoundException(id));

        if (execution.state().isTerminal()) {
            return execution;
        }

        return executionRepository.save(execution.killRequested());
    }

    public record ExecutionContext(Execution execution, Workflow workflow,
                                   WorkflowRevision revision) {
    }

    @Transactional(readOnly = true)
    public ExecutionContext findContext(ExecutionId id) {
        var exec = executionRepository.findById(id)
                .orElseThrow(() -> new ExecutionNotFoundException(id));
        return resolveContext(exec);
    }

    @Transactional(readOnly = true)
    public List<ExecutionContext> findRecent(int limit, ExecutionState stateFilter) {
        return executionRepository.findRecent(limit, stateFilter).stream()
                .map(this::resolveContext)
                .toList();
    }

    private ExecutionContext resolveContext(Execution exec) {
        var workflow = workflowRepository.findById(exec.workflowId())
                .orElseThrow(() -> new WorkflowNotFoundException(exec.workflowId()));
        var revision = workflowRepository.findRevisionById(exec.workflowRevisionId())
                .orElseThrow(() -> new IllegalStateException(
                        "Revision missing for execution " + exec.id().value()
                                + " (revision id " + exec.workflowRevisionId() + ")"));
        return new ExecutionContext(exec, workflow, revision);
    }
}
