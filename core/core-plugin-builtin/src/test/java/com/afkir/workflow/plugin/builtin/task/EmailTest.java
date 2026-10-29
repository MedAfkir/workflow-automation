package com.afkir.workflow.plugin.builtin.task;

import com.afkir.workflow.plugin.builtin.FakeRunContext;
import com.afkir.workflow.plugin.error.NonRetryableException;
import com.afkir.workflow.plugin.error.PluginException;
import com.afkir.workflow.plugin.error.RetryableException;
import com.icegreen.greenmail.configuration.GreenMailConfiguration;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.GreenMailUtil;
import com.icegreen.greenmail.util.ServerSetupTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import tools.jackson.databind.json.JsonMapper;

import java.net.ServerSocket;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EmailTest {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    // Override value that removes a key from the base config.
    private static final Object NONE = new Object();

    @RegisterExtension
    static GreenMailExtension greenMail = new GreenMailExtension(ServerSetupTest.SMTP.dynamicPort())
            .withConfiguration(GreenMailConfiguration.aConfig().withUser("ops@localhost", "ops", "s3cret"))
            .withPerMethodLifecycle(true);

    private final Email task = new Email();

    // Built through Jackson, the same way the engine maps a task's resolved config.
    private static Email.Input input(Map<String, Object> overrides) {
        var config = new HashMap<String, Object>(Map.of(
                "host", "localhost",
                "port", greenMail.getSmtp().getPort(),
                "username", "ops",
                "password", "s3cret",
                "startTls", false,
                "from", "Workflow <ops@localhost>",
                "to", List.of("alice@localhost"),
                "subject", "Nightly report",
                "body", "All 12 tasks succeeded."
        ));
        config.putAll(overrides);
        config.values().removeIf(v -> v == NONE);
        return JSON.convertValue(config, Email.Input.class);
    }

    @Test
    void sendsPlainTextMessage() throws Exception {
        var output = task.run(new FakeRunContext<>(input(Map.of())));

        var received = greenMail.getReceivedMessages();
        assertThat(received).hasSize(1);
        assertThat(received[0].getSubject()).isEqualTo("Nightly report");
        assertThat(GreenMailUtil.getBody(received[0])).isEqualTo("All 12 tasks succeeded.");
        assertThat(received[0].getContentType()).startsWith("text/plain");
        assertThat(output.messageId()).isEqualTo(received[0].getMessageID());
        assertThat(output.accepted()).containsExactly("alice@localhost");
    }

    @Test
    void sendsHtmlBody() throws Exception {
        task.run(new FakeRunContext<>(input(Map.of("html", true, "body", "<p>All <b>green</b></p>"))));

        var received = greenMail.getReceivedMessages();
        assertThat(received[0].getContentType()).startsWith("text/html");
        assertThat(GreenMailUtil.getBody(received[0])).isEqualTo("<p>All <b>green</b></p>");
    }

    @Test
    void deliversToCcAndBccWithoutExposingBcc() throws Exception {
        var output = task.run(new FakeRunContext<>(input(Map.of(
                "cc", "bob@localhost",
                "bcc", List.of("carol@localhost")))));

        assertThat(output.accepted()).containsExactly("alice@localhost", "bob@localhost", "carol@localhost");
        var received = greenMail.getReceivedMessages();
        assertThat(received).hasSize(3);
        assertThat(received[0].getHeader("Bcc")).isNull();
    }

    @Test
    void acceptsCommaSeparatedRecipientsInOneString() throws Exception {
        var output = task.run(new FakeRunContext<>(input(Map.of("to", "alice@localhost, bob@localhost"))));

        assertThat(output.accepted()).containsExactly("alice@localhost", "bob@localhost");
        assertThat(greenMail.getReceivedMessages()).hasSize(2);
    }

    @Test
    void resolvesPasswordFromNamespaceSecret() throws Exception {
        var ctx = new FakeRunContext<>(input(Map.of("password", NONE, "passwordSecret", "smtp_password")))
                .withSecret("smtp_password", "s3cret");

        task.run(ctx);

        assertThat(greenMail.getReceivedMessages()).hasSize(1);
    }

    @Test
    void neverLogsThePassword() throws Exception {
        var ctx = new FakeRunContext<>(input(Map.of()));

        task.run(ctx);

        assertThat(ctx.logs()).isNotEmpty().noneMatch(line -> line.contains("s3cret"));
    }

    @Test
    void badCredentialsAreNonRetryable() {
        var ctx = new FakeRunContext<>(input(Map.of("password", "wrong")));

        assertThatThrownBy(() -> task.run(ctx))
                .isInstanceOf(NonRetryableException.class)
                .extracting(e -> ((PluginException) e).errorCode())
                .isEqualTo("EMAIL_AUTH_FAILED");
        assertThat(greenMail.getReceivedMessages()).isEmpty();
    }

    @Test
    void missingSecretIsNonRetryable() {
        var ctx = new FakeRunContext<>(input(Map.of("password", NONE, "passwordSecret", "smtp_password")));

        assertThatThrownBy(() -> task.run(ctx))
                .isInstanceOf(NonRetryableException.class)
                .hasMessageContaining("smtp_password");
    }

    @Test
    void unreachableServerIsRetryable() throws Exception {
        int closedPort;
        try (var socket = new ServerSocket(0)) {
            closedPort = socket.getLocalPort();
        }
        var ctx = new FakeRunContext<>(input(Map.of("port", closedPort, "timeout", "PT2S")));

        assertThatThrownBy(() -> task.run(ctx))
                .isInstanceOf(RetryableException.class)
                .extracting(e -> ((PluginException) e).errorCode())
                .isEqualTo("EMAIL_CONNECTION_ERROR");
    }

    @Test
    void requiredStartTlsFailsWhenServerDoesNotOfferIt() {
        var ctx = new FakeRunContext<>(input(Map.of("startTls", true)));

        assertThatThrownBy(() -> task.run(ctx))
                .isInstanceOf(NonRetryableException.class)
                .hasMessageContaining("STARTTLS");
        assertThat(greenMail.getReceivedMessages()).isEmpty();
    }

    @Test
    void malformedAddressIsNonRetryable() {
        var ctx = new FakeRunContext<>(input(Map.of("to", "<alice@localhost")));

        assertThatThrownBy(() -> task.run(ctx))
                .isInstanceOf(NonRetryableException.class)
                .extracting(e -> ((PluginException) e).errorCode())
                .isEqualTo("EMAIL_INVALID_ADDRESS");
    }

    @Test
    void cancelledTaskSendsNothing() {
        var ctx = new FakeRunContext<>(input(Map.of())).cancel();

        assertThatThrownBy(() -> task.run(ctx)).isInstanceOf(NonRetryableException.class);
        assertThat(greenMail.getReceivedMessages()).isEmpty();
    }

    @Test
    void rejectsConfigWithoutRecipients() {
        assertThatThrownBy(() -> input(Map.of("to", List.of())))
                .hasRootCauseInstanceOf(IllegalArgumentException.class)
                .hasRootCauseMessage("to must contain at least one address");
    }

    @Test
    void rejectsPasswordAndPasswordSecretTogether() {
        assertThatThrownBy(() -> input(Map.of("passwordSecret", "smtp_password")))
                .hasRootCauseInstanceOf(IllegalArgumentException.class)
                .hasRootCauseMessage("set either password or passwordSecret, not both");
    }

    @Test
    void appliesDefaults() {
        var defaults = input(Map.of("port", NONE, "startTls", NONE, "body", NONE));

        assertThat(defaults.port()).isEqualTo(587);
        assertThat(defaults.startTls()).isTrue();
        assertThat(defaults.html()).isFalse();
        assertThat(defaults.body()).isEmpty();
        assertThat(defaults.cc()).isEmpty();
    }
}
