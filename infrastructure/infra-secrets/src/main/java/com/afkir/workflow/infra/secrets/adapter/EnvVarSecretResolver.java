package com.afkir.workflow.infra.secrets.adapter;

import com.afkir.workflow.infra.secrets.NamespacedSecretResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@Order(1)
public class EnvVarSecretResolver implements NamespacedSecretResolver {

    private static final Logger log = LoggerFactory.getLogger(EnvVarSecretResolver.class);

    @Override
    public Optional<String> resolve(String namespace, String key) {
        var value = System.getenv(key);
        if (value == null || value.isEmpty()) return Optional.empty();
        log.debug("Resolved secret {} from environment variables", key);
        return Optional.of(value);
    }
}
