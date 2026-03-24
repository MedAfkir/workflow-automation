package com.afkir.workflow.domain.execution;

import java.util.List;

public interface TaskRunRepository {

    TaskRun save(TaskRun taskRun);

    List<TaskRun> findByExecutionIdOrderBySequence(ExecutionId executionId);

}