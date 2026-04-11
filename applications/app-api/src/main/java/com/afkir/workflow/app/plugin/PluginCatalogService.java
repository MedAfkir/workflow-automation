package com.afkir.workflow.app.plugin;

import com.afkir.workflow.engine.plugin.PluginRegistry;
import com.afkir.workflow.engine.trigger.TriggerPluginRegistry;
import com.afkir.workflow.plugin.meta.Plugin;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.stream.Stream;

@Service
public class PluginCatalogService {

    private final Snapshot cached;

    public PluginCatalogService(
            PluginRegistry tasks,
            TriggerPluginRegistry triggers,
            PluginSchemaBuilder schemaBuilder) {
        this.cached = computeSnapshot(tasks, triggers, schemaBuilder);
    }

    public Snapshot snapshot() {
        return cached;
    }

    private static Snapshot computeSnapshot(
            PluginRegistry tasks,
            TriggerPluginRegistry triggers,
            PluginSchemaBuilder schemaBuilder) {

        Stream<PluginDescriptor> taskDescriptors = tasks.all().values().stream()
                .map(p -> toDescriptor(p, schemaBuilder));

        Stream<PluginDescriptor> triggerDescriptors = triggers.all().values().stream()
                .map(p -> toDescriptor(p, schemaBuilder));

        List<PluginDescriptor> descriptors = Stream
                .concat(taskDescriptors, triggerDescriptors)
                .sorted(Comparator.comparing(PluginDescriptor::id))
                .toList();

        String etag = computeEtag(descriptors);
        return new Snapshot(descriptors, etag);
    }

    private static PluginDescriptor toDescriptor(
            PluginRegistry.RegisteredPlugin p, PluginSchemaBuilder schemaBuilder) {
        Plugin meta = p.meta();
        PluginDescriptor.PluginKind kind = switch (p.kind()) {
            case RUNNABLE -> PluginDescriptor.PluginKind.RUNNABLE;
            case FLOWABLE -> PluginDescriptor.PluginKind.FLOWABLE;
        };
        return new PluginDescriptor(
                meta.id(),
                meta.version(),
                meta.description(),
                kind,
                List.of(meta.categories()),
                meta.deprecated(),
                meta.replacedBy().isBlank() ? null : meta.replacedBy(),
                schemaBuilder.buildSchema(p.inputType()));
    }

    private static PluginDescriptor toDescriptor(
            TriggerPluginRegistry.RegisteredPolledTrigger p, PluginSchemaBuilder schemaBuilder) {
        Plugin meta = p.meta();
        return new PluginDescriptor(
                meta.id(),
                meta.version(),
                meta.description(),
                PluginDescriptor.PluginKind.TRIGGER,
                List.of(meta.categories()),
                meta.deprecated(),
                meta.replacedBy().isBlank() ? null : meta.replacedBy(),
                schemaBuilder.buildSchema(p.configType()));
    }

    private static String computeEtag(List<PluginDescriptor> descriptors) {
        String fingerprint = descriptors.stream()
                .map(d -> d.id() + "@" + d.version())
                .reduce((a, b) -> a + "\n" + b)
                .orElse("");
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(fingerprint.getBytes());
            return "W/\"" + HexFormat.of().formatHex(hash) + "\"";
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    public record Snapshot(List<PluginDescriptor> descriptors, String etag) {
    }
}
