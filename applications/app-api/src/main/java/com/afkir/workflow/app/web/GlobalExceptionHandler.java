package com.afkir.workflow.app.web;

import com.afkir.workflow.engine.plugin.PluginNotFoundException;
import com.afkir.workflow.app.execution.ExecutionNotFoundException;
import com.afkir.workflow.infra.secrets.SecretAlreadyExistsException;
import com.afkir.workflow.infra.secrets.SecretNotFoundException;
import com.afkir.workflow.app.trigger.TriggerNotFoundException;
import com.afkir.workflow.app.workflow.WorkflowAlreadyExistsException;
import com.afkir.workflow.app.workflow.WorkflowNotFoundException;
import com.afkir.workflow.infra.yaml.YamlParsingException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(WorkflowNotFoundException.class)
    public ResponseEntity<ApiError> notFound(WorkflowNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError("WORKFLOW_NOT_FOUND", ex.getMessage(), Instant.now()));
    }

    @ExceptionHandler(WorkflowAlreadyExistsException.class)
    public ResponseEntity<ApiError> conflict(WorkflowAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError("WORKFLOW_ALREADY_EXISTS", ex.getMessage(), Instant.now()));
    }

    @ExceptionHandler({YamlParsingException.class, IllegalArgumentException.class})
    public ResponseEntity<ApiError> badRequest(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError("INVALID_INPUT", ex.getMessage(), Instant.now()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex) {
        var msg = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b).orElse("Validation error");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError("VALIDATION_ERROR", msg, Instant.now()));
    }

    @ExceptionHandler(ExecutionNotFoundException.class)
    public ResponseEntity<ApiError> notFound(ExecutionNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError("EXECUTION_NOT_FOUND", ex.getMessage(), Instant.now()));
    }

    @ExceptionHandler(TriggerNotFoundException.class)
    public ResponseEntity<ApiError> notFound(TriggerNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError("TRIGGER_NOT_FOUND", ex.getMessage(), Instant.now()));
    }

    @ExceptionHandler(PluginNotFoundException.class)
    public ResponseEntity<ApiError> pluginNotFound(PluginNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ApiError("PLUGIN_NOT_FOUND", ex.getMessage(), Instant.now()));
    }

    @ExceptionHandler(SecretNotFoundException.class)
    public ResponseEntity<ApiError> secretNotFound(SecretNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError("SECRET_NOT_FOUND", ex.getMessage(), Instant.now()));
    }

    @ExceptionHandler(SecretAlreadyExistsException.class)
    public ResponseEntity<ApiError> secretAlreadyExists(SecretAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError("SECRET_ALREADY_EXISTS", ex.getMessage(), Instant.now()));
    }
}
