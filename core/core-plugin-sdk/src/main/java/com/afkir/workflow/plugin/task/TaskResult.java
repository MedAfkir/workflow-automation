package com.afkir.workflow.plugin.task;

import java.time.Duration;


public sealed interface TaskResult {

    
    record Success(TaskOutput output, Duration elapsed) implements TaskResult {}

    
    record Failure(String errorCode, String message, String stackTrace,
                   boolean retryable, Duration elapsed) implements TaskResult {}

    
    record Cancelled(String reason, Duration elapsed) implements TaskResult {}

}