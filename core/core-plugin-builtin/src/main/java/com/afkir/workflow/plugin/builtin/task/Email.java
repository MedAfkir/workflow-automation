package com.afkir.workflow.plugin.builtin.task;

import com.afkir.workflow.plugin.error.NonRetryableException;
import com.afkir.workflow.plugin.error.PluginException;
import com.afkir.workflow.plugin.error.RetryableException;
import com.afkir.workflow.plugin.meta.Plugin;
import com.afkir.workflow.plugin.meta.PropertyDoc;
import com.afkir.workflow.plugin.meta.Sensitive;
import com.afkir.workflow.plugin.runtime.RunContext;
import com.afkir.workflow.plugin.task.RunnableTask;
import com.afkir.workflow.plugin.task.TaskOutput;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.mail.AuthenticationFailedException;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import org.eclipse.angus.mail.smtp.SMTPAddressFailedException;
import org.eclipse.angus.mail.smtp.SMTPSendFailedException;
import org.eclipse.angus.mail.smtp.SMTPSenderFailedException;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

@Component
@Plugin(
        id = "io.workflowplatform.builtin.Email",
        version = "1.0.0",
        description = "Sends an email over SMTP",
        categories = {"email", "notification", "integration"}
)
public class Email implements RunnableTask<Email.Input, Email.Output> {

    public record Input(
            @PropertyDoc(description = "SMTP server host")
            @NotBlank
            String host,

            @PropertyDoc(description = "SMTP server port", defaultValue = "587")
            Integer port,

            @PropertyDoc(description = "SMTP username (omit for servers without authentication)")
            String username,

            @PropertyDoc(description = "SMTP password (sensitive; prefer passwordSecret so it is never stored with the task run)")
            @Sensitive String password,

            @PropertyDoc(description = "Name of the namespace secret holding the SMTP password")
            String passwordSecret,

            @PropertyDoc(description = "Sender address, e.g. \"Ops <ops@example.com>\"")
            @NotBlank
            String from,

            @PropertyDoc(description = "Recipient addresses")
            @NotEmpty
            @JsonFormat(with = JsonFormat.Feature.ACCEPT_SINGLE_VALUE_AS_ARRAY)
            List<String> to,

            @PropertyDoc(description = "Carbon-copy addresses")
            @JsonFormat(with = JsonFormat.Feature.ACCEPT_SINGLE_VALUE_AS_ARRAY)
            List<String> cc,

            @PropertyDoc(description = "Blind carbon-copy addresses")
            @JsonFormat(with = JsonFormat.Feature.ACCEPT_SINGLE_VALUE_AS_ARRAY)
            List<String> bcc,

            @PropertyDoc(description = "Subject line")
            @NotBlank
            String subject,

            @PropertyDoc(description = "Message body (plain text, or HTML when html is true)")
            String body,

            @PropertyDoc(description = "Send the body as HTML", defaultValue = "false")
            Boolean html,

            @PropertyDoc(description = "Require STARTTLS before sending credentials or content", defaultValue = "true")
            Boolean startTls,

            @PropertyDoc(description = "Connect, read and write timeout (ISO-8601, e.g. PT30S)", defaultValue = "PT30S")
            Duration timeout
    ) {
        public Input {
            if (host == null || host.isBlank()) {
                throw new IllegalArgumentException("host is required");
            }
            if (port == null) port = 587;
            if (port < 1 || port > 65535) {
                throw new IllegalArgumentException("port must be between 1 and 65535");
            }
            if (password != null && passwordSecret != null) {
                throw new IllegalArgumentException("set either password or passwordSecret, not both");
            }
            if (from == null || from.isBlank()) {
                throw new IllegalArgumentException("from is required");
            }
            if (to == null || to.isEmpty()) {
                throw new IllegalArgumentException("to must contain at least one address");
            }
            if (subject == null || subject.isBlank()) {
                throw new IllegalArgumentException("subject is required");
            }
            if (cc == null) cc = List.of();
            if (bcc == null) bcc = List.of();
            if (body == null) body = "";
            if (html == null) html = false;
            if (startTls == null) startTls = true;
            if (timeout == null) timeout = Duration.ofSeconds(30);
        }
    }

    public record Output(
            String messageId,
            List<String> accepted
    ) implements TaskOutput {
    }

    @Override
    public Output run(RunContext<Input> ctx) {
        var input = ctx.input();
        var password = resolvePassword(ctx);
        var session = Session.getInstance(sessionProperties(input));

        MimeMessage message;
        List<String> recipients;
        String messageId;
        try {
            message = new MimeMessage(session);
            message.setFrom(new InternetAddress(input.from(), true));
            recipients = new ArrayList<>();
            addRecipients(message, Message.RecipientType.TO, input.to(), recipients);
            addRecipients(message, Message.RecipientType.CC, input.cc(), recipients);
            addRecipients(message, Message.RecipientType.BCC, input.bcc(), recipients);
            message.setSubject(input.subject(), StandardCharsets.UTF_8.name());
            if (input.html()) {
                message.setContent(input.body(), "text/html; charset=UTF-8");
            } else {
                message.setText(input.body(), StandardCharsets.UTF_8.name());
            }
            message.saveChanges();
            messageId = message.getMessageID();
        } catch (AddressException e) {
            throw new NonRetryableException("EMAIL_INVALID_ADDRESS",
                    "Invalid address '" + e.getRef() + "': " + e.getMessage(), e);
        } catch (MessagingException e) {
            throw new NonRetryableException("EMAIL_INVALID_MESSAGE",
                    "Cannot build message: " + e.getMessage(), e);
        }

        if (ctx.isCancelled()) {
            throw new NonRetryableException("EMAIL_CANCELLED", "Cancelled before the message was sent");
        }

        ctx.logger().info("Sending email to {} recipient(s) via {}:{}",
                recipients.size(), input.host(), input.port());

        // Once the server has accepted the message, a failing QUIT must not fail the task:
        // a retry would deliver the email a second time.
        var sent = false;
        try (var transport = session.getTransport("smtp")) {
            transport.connect(input.host(), input.port(), input.username(), password);
            transport.sendMessage(message, message.getAllRecipients());
            sent = true;
        } catch (MessagingException e) {
            if (!sent) throw classify(e, input);
            ctx.logger().warn("Email sent but the SMTP connection did not close cleanly: {}", e.getMessage());
        }

        ctx.logger().info("Email sent, Message-ID {}", messageId);
        return new Output(messageId, List.copyOf(recipients));
    }

    private String resolvePassword(RunContext<Input> ctx) {
        var input = ctx.input();
        if (input.passwordSecret() == null) return input.password();
        return ctx.secrets().resolve(input.passwordSecret())
                .orElseThrow(() -> new NonRetryableException("EMAIL_SECRET_NOT_FOUND",
                        "Secret '" + input.passwordSecret() + "' not found in namespace"));
    }

    private Properties sessionProperties(Input input) {
        var timeoutMs = String.valueOf(input.timeout().toMillis());
        var props = new Properties();
        props.put("mail.smtp.host", input.host());
        props.put("mail.smtp.port", String.valueOf(input.port()));
        props.put("mail.smtp.auth", String.valueOf(input.username() != null));
        props.put("mail.smtp.starttls.enable", String.valueOf(input.startTls()));
        props.put("mail.smtp.starttls.required", String.valueOf(input.startTls()));
        props.put("mail.smtp.connectiontimeout", timeoutMs);
        props.put("mail.smtp.timeout", timeoutMs);
        props.put("mail.smtp.writetimeout", timeoutMs);
        return props;
    }

    // Each entry may itself be a comma-separated list, which is what a templated
    // "{{ inputs.recipients }}" usually renders to.
    private void addRecipients(MimeMessage message, Message.RecipientType type,
                               List<String> entries, List<String> collected) throws MessagingException {
        for (var entry : entries) {
            for (var address : InternetAddress.parse(entry, true)) {
                message.addRecipient(type, address);
                collected.add(address.getAddress());
            }
        }
    }

    private PluginException classify(MessagingException e, Input input) {
        if (e instanceof AuthenticationFailedException) {
            return new NonRetryableException("EMAIL_AUTH_FAILED",
                    "SMTP authentication failed for user '" + input.username() + "'", e);
        }
        var code = smtpReturnCode(e);
        if (code >= 500) {
            return new NonRetryableException("EMAIL_REJECTED",
                    "SMTP server rejected the message (" + code + "): " + e.getMessage(), e);
        }
        if (code >= 400) {
            return new RetryableException("EMAIL_TEMPORARY_FAILURE",
                    "SMTP server deferred the message (" + code + "): " + e.getMessage(), e);
        }
        if (hasIoCause(e)) {
            return new RetryableException("EMAIL_CONNECTION_ERROR",
                    "Cannot reach " + input.host() + ":" + input.port() + ": " + e.getMessage(), e);
        }
        return new NonRetryableException("EMAIL_SEND_FAILED", e.getMessage(), e);
    }

    // Recipient rejections arrive as a SendFailedException whose chain holds the SMTP reply.
    private int smtpReturnCode(MessagingException e) {
        for (Exception current = e; current != null;
             current = current instanceof MessagingException m ? m.getNextException() : null) {
            switch (current) {
                case SMTPSendFailedException s -> { return s.getReturnCode(); }
                case SMTPAddressFailedException a -> { return a.getReturnCode(); }
                case SMTPSenderFailedException s -> { return s.getReturnCode(); }
                default -> { }
            }
        }
        return -1;
    }

    private boolean hasIoCause(Throwable e) {
        for (var current = e; current != null; current = current.getCause()) {
            if (current instanceof IOException) return true;
        }
        return false;
    }

}
