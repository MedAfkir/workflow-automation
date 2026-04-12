package com.afkir.workflow.app.trigger;

import com.afkir.workflow.engine.execution.ExecutionFactory;
import com.afkir.workflow.domain.execution.ExecutionRepository;
import com.afkir.workflow.domain.trigger.TriggerRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Collections;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/triggers/webhook")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    private final TriggerRepository triggerRepository;
    private final ExecutionRepository executionRepository;
    private final ExecutionFactory executionFactory;

    public WebhookController(TriggerRepository triggerRepository,
                             ExecutionRepository executionRepository,
                             ExecutionFactory executionFactory) {
        this.triggerRepository = triggerRepository;
        this.executionRepository = executionRepository;
        this.executionFactory = executionFactory;
    }

    @PostMapping(value = "/{key}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<WebhookResponse> trigger(
            @PathVariable String key,
            @RequestBody(required = false) Map<String, Object> payload,
            @RequestHeader(value = "X-Workflow-Signature", required = false) String signature,
            HttpServletRequest request) {

        var trigger = triggerRepository.findByWebhookKey(key)
                .orElseThrow(() -> new TriggerNotFoundException(key));

        if (!trigger.enabled()) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(new WebhookResponse(null, "Trigger is disabled"));
        }

        if (!trigger.type().equals("io.workflowplatform.builtin.Webhook")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new WebhookResponse(null, "Not a webhook trigger"));
        }

        var signatureSecret = (String) trigger.config().get("signatureSecret");
        if (signatureSecret != null && !signatureSecret.isBlank()) {
            try {
                var rawBody = readRawBody(request);
                if (!verifySignature(rawBody, signatureSecret, signature)) {
                    log.warn("Webhook {} signature mismatch", trigger.id());
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(new WebhookResponse(null, "Invalid signature"));
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new WebhookResponse(null, "Cannot verify signature"));
            }
        }

        var headers = collectHeaders(request);
        var execution = executionFactory.fromWebhook(trigger, payload, headers);
        var saved = executionRepository.save(execution);

        log.info("Webhook {} fired execution {}", trigger.id(), saved.id());
        return ResponseEntity.accepted()
                .header("Location", "/api/v1/executions/" + saved.id())
                .body(new WebhookResponse(saved.id().value(), "Execution created"));
    }

    private Map<String, String> collectHeaders(HttpServletRequest request) {
        var headers = new HashMap<String, String>();
        var names = request.getHeaderNames();
        if (names == null) return Map.of();
        Collections.list(names).forEach(name -> {
            if (!name.equalsIgnoreCase("authorization")
                    && !name.toLowerCase().startsWith("cookie")) {
                headers.put(name, request.getHeader(name));
            }
        });
        return headers;
    }

    private boolean verifySignature(byte[] body, String secret, String signature) {
        if (signature == null) return false;
        try {
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            var computed = mac.doFinal(body);
            var computedHex = HexFormat.of().formatHex(computed);
            return MessageDigest.isEqual(
                    computedHex.getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            return false;
        }
    }

    private byte[] readRawBody(HttpServletRequest request) throws IOException {
        return request.getInputStream().readAllBytes();
    }

    public record WebhookResponse(UUID executionId, String message) {
    }
}
