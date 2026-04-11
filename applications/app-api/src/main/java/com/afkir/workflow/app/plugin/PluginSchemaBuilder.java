package com.afkir.workflow.app.plugin;

import com.afkir.workflow.plugin.meta.PropertyDoc;
import com.afkir.workflow.plugin.meta.Sensitive;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.victools.jsonschema.generator.Option;
import com.github.victools.jsonschema.generator.OptionPreset;
import com.github.victools.jsonschema.generator.SchemaGenerator;
import com.github.victools.jsonschema.generator.SchemaGeneratorConfig;
import com.github.victools.jsonschema.generator.SchemaGeneratorConfigBuilder;
import com.github.victools.jsonschema.generator.SchemaVersion;
import com.github.victools.jsonschema.module.jakarta.validation.JakartaValidationModule;
import com.github.victools.jsonschema.module.jakarta.validation.JakartaValidationOption;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class PluginSchemaBuilder {

    private final SchemaGenerator generator;
    
    private final ObjectMapper jacksonV2 = new ObjectMapper();

    public PluginSchemaBuilder() {
        var jakartaModule = new JakartaValidationModule(
                JakartaValidationOption.NOT_NULLABLE_FIELD_IS_REQUIRED,
                JakartaValidationOption.INCLUDE_PATTERN_EXPRESSIONS);

        SchemaGeneratorConfig config = new SchemaGeneratorConfigBuilder(
                SchemaVersion.DRAFT_2020_12, OptionPreset.PLAIN_JSON)
                .with(jakartaModule)
                .with(this::registerPluginAnnotations)
                .with(Option.INLINE_ALL_SCHEMAS)
                .build();
        this.generator = new SchemaGenerator(config);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> buildSchema(Class<?> inputType) {
        JsonNode v2Node = generator.generateSchema(inputType);
        return jacksonV2.convertValue(v2Node, Map.class);
    }

    private void registerPluginAnnotations(SchemaGeneratorConfigBuilder builder) {
        var fieldConfig = builder.forFields();

        fieldConfig.withDescriptionResolver(field -> {
            var doc = field.getAnnotationConsideringFieldAndGetter(PropertyDoc.class);
            if (doc == null || doc.description().isBlank()) return null;
            return doc.description();
        });

        fieldConfig.withStringFormatResolver(field -> {
            var doc = field.getAnnotationConsideringFieldAndGetter(PropertyDoc.class);
            if (doc == null || doc.format().isBlank()) return null;
            return doc.format();
        });

        fieldConfig.withDefaultResolver(field -> {
            var doc = field.getAnnotationConsideringFieldAndGetter(PropertyDoc.class);
            if (doc == null || doc.defaultValue().isBlank()) return null;
            return doc.defaultValue();
        });

        fieldConfig.withInstanceAttributeOverride((node, field, ctx) -> {
            if (field.getAnnotationConsideringFieldAndGetter(Sensitive.class) != null) {
                ((ObjectNode) node).put("x-sensitive", true);
            }
        });
    }
}
