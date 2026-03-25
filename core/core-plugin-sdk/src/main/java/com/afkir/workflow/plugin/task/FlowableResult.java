package com.afkir.workflow.plugin.task;

import java.time.Duration;
import java.util.List;


public sealed interface FlowableResult {

    
    record SpawnTasks(List<SubTaskDefinition> tasks, Integer concurrency)
        implements FlowableResult {}

    
    record WaitFor(Duration duration) implements FlowableResult {}

    
    record WaitForSignal(String signalName) implements FlowableResult {}

    
    record Complete(Object outputs) implements FlowableResult {}

    
    record Fail(String errorCode, String message) implements FlowableResult {}
}