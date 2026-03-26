package com.afkir.workflow.plugin.builtin.task;

import com.afkir.workflow.plugin.error.NonRetryableException;
import com.afkir.workflow.plugin.error.RetryableException;
import tools.jackson.databind.json.JsonMapper;
import com.afkir.workflow.plugin.meta.Plugin;
import com.afkir.workflow.plugin.meta.PropertyDoc;
import com.afkir.workflow.plugin.meta.Sensitive;
import com.afkir.workflow.plugin.runtime.RunContext;
import com.afkir.workflow.plugin.task.RunnableTask;
import com.afkir.workflow.plugin.task.TaskOutput;
import jakarta.validation.constraints.NotBlank;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
@Plugin(
        id = "io.workflowplatform.builtin.Http",
        version = "1.0.0",
        description = "Performs an HTTP request",
        categories = {"http", "integration"}
)
public class Http implements RunnableTask<Http.Input, Http.Output> {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    public record Input(
            @PropertyDoc(description = "Target URL", format = "url")
            @NotBlank
            String url,

            @PropertyDoc(description = "HTTP method", defaultValue = "GET")
            Method method,

            @PropertyDoc(description = "HTTP headers")
            Map<String, String> headers,

            @PropertyDoc(description = "Request body (object will be JSON-serialized, string sent as-is)")
            Object body,

            @PropertyDoc(description = "Connect+request timeout (ISO-8601, e.g. PT30S)", defaultValue = "PT30S")
            Duration timeout,

            @PropertyDoc(description = "Treat 4xx as success (don't fail the task)", defaultValue = "false")
            Boolean allowFailureStatus,

            @PropertyDoc(description = "Bearer token (sensitive, scrubbed from logs)")
            @Sensitive String bearerToken
    ) {
        public Input {
            if (url == null || url.isBlank()) {
                throw new IllegalArgumentException("url is required");
            }
            if (method == null) method = Method.GET;
            if (headers == null) headers = Map.of();
            if (timeout == null) timeout = Duration.ofSeconds(30);
            if (allowFailureStatus == null) allowFailureStatus = false;
        }
    }

    public record Output(
            int status,
            Map<String, List<String>> headers,
            Object body,             
            long elapsedMs
    ) implements TaskOutput {
    }

    public enum Method {GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS}

    @Override
    public Output run(RunContext<Input> ctx) throws Exception {
        var input = ctx.input();
        ctx.logger().info("HTTP {} {}", input.method(), input.url());

        var client = HttpClient.newBuilder()
                .connectTimeout(input.timeout())
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();

        var requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(input.url()))
                .timeout(input.timeout());

        for (var entry : input.headers().entrySet()) {
            requestBuilder.header(entry.getKey(), entry.getValue());
        }
        if (input.bearerToken() != null && !input.bearerToken().isBlank()) {
            requestBuilder.header("Authorization", "Bearer " + input.bearerToken());
        }

        var bodyPublisher = buildBodyPublisher(input);
        switch (input.method()) {
            case GET -> requestBuilder.GET();
            case POST -> requestBuilder.POST(bodyPublisher);
            case PUT -> requestBuilder.PUT(bodyPublisher);
            case PATCH -> requestBuilder.method("PATCH", bodyPublisher);
            case DELETE -> requestBuilder.DELETE();
            case HEAD -> requestBuilder.method("HEAD", HttpRequest.BodyPublishers.noBody());
            case OPTIONS -> requestBuilder.method("OPTIONS", HttpRequest.BodyPublishers.noBody());
        }

        if (input.method() == Method.POST || input.method() == Method.PUT
                || input.method() == Method.PATCH) {
            requestBuilder.header("Idempotency-Key", ctx.execution().idempotencyKey());
        }

        long start = System.currentTimeMillis();
        HttpResponse<String> response;
        try {
            response = client.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
        } catch (java.net.http.HttpTimeoutException e) {
            throw new RetryableException("HTTP_TIMEOUT",
                    "Request timed out after " + input.timeout(), e);
        } catch (java.io.IOException e) {
            throw new RetryableException("HTTP_IO_ERROR",
                    "I/O error: " + e.getMessage(), e);
        }
        long elapsed = System.currentTimeMillis() - start;

        var status = response.statusCode();
        ctx.logger().info("HTTP {} -> {} in {}ms", input.method(), status, elapsed);

        if (ctx.isCancelled()) {
            ctx.logger().warn("Cancelled after response received");
        }

        Object parsedBody = parseBody(response);

        if (status >= 200 && status < 400) {
            return new Output(status, response.headers().map(), parsedBody, elapsed);
        }
        if (status >= 400 && status < 500) {
            if (input.allowFailureStatus()) {
                ctx.logger().warn("HTTP {} (client error, allowed by config)", status);
                return new Output(status, response.headers().map(), parsedBody, elapsed);
            }
            throw new NonRetryableException("HTTP_" + status,
                    "Client error " + status + ": " + truncate(response.body(), 500));
        }
        
        throw new RetryableException("HTTP_" + status,
                "Server error " + status + ": " + truncate(response.body(), 500));
    }

    private HttpRequest.BodyPublisher buildBodyPublisher(Input input) {
        if (input.body() == null) return HttpRequest.BodyPublishers.noBody();
        if (input.body() instanceof String s) return HttpRequest.BodyPublishers.ofString(s);
        
        try {
            var json = JSON.writeValueAsString(input.body());
            return HttpRequest.BodyPublishers.ofString(json);
        } catch (Exception e) {
            throw new IllegalArgumentException("Cannot serialize body to JSON", e);
        }
    }

    private Object parseBody(HttpResponse<String> response) {
        var contentType = response.headers().firstValue("Content-Type").orElse("");
        var body = response.body();
        if (body == null || body.isEmpty()) return null;
        if (contentType.toLowerCase().contains("json")) {
            try {
                return JSON.readTree(body);
            } catch (Exception ignored) {
                
            }
        }
        return body;
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

}
