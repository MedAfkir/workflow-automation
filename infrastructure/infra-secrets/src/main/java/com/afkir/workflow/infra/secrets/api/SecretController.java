package com.afkir.workflow.infra.secrets.api;

import com.afkir.workflow.infra.secrets.SecretManagementService;
import com.afkir.workflow.infra.secrets.api.dto.CreateSecretRequest;
import com.afkir.workflow.infra.secrets.api.dto.RotateSecretRequest;
import com.afkir.workflow.infra.secrets.api.dto.SecretSummaryResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/secrets")
public class SecretController {

    private final SecretManagementService service;

    public SecretController(SecretManagementService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<SecretSummaryResponse> create(@Valid @RequestBody CreateSecretRequest req) {
        var summary = service.create(req.namespace(), req.key(), req.value());
        return ResponseEntity
                .created(URI.create("/api/v1/secrets/" + summary.namespace() + "/" + summary.key()))
                .body(toResponse(summary));
    }

    @GetMapping("/{namespace}")
    public List<SecretSummaryResponse> list(@PathVariable String namespace) {
        return service.list(namespace).stream()
                .map(SecretController::toResponse)
                .toList();
    }

    @PutMapping("/{namespace}/{key}")
    public SecretSummaryResponse rotate(@PathVariable String namespace,
                                         @PathVariable String key,
                                         @Valid @RequestBody RotateSecretRequest req) {
        var summary = service.rotate(namespace, key, req.value());
        return toResponse(summary);
    }

    @DeleteMapping("/{namespace}/{key}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String namespace, @PathVariable String key) {
        service.delete(namespace, key);
    }

    private static SecretSummaryResponse toResponse(SecretManagementService.SecretSummary s) {
        return new SecretSummaryResponse(
                s.id(), s.namespace(), s.key(), s.version(), s.createdAt(), s.updatedAt()
        );
    }
}
