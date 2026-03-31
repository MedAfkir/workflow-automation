package com.afkir.workflow.infra.secrets.composite;

import com.afkir.workflow.engine.secrets.SecretResolverFactory;
import com.afkir.workflow.infra.secrets.NamespacedSecretResolver;
import com.afkir.workflow.plugin.runtime.SecretResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@Primary
public class CompositeSecretResolverFactory implements SecretResolverFactory {

    private static final Logger log = LoggerFactory.getLogger(CompositeSecretResolverFactory.class);

    private final List<NamespacedSecretResolver> chain;

    public CompositeSecretResolverFactory(List<NamespacedSecretResolver> chain) {
        this.chain = chain;
        log.info("CompositeSecretResolverFactory initialised with {} adapter(s):", chain.size());
        chain.forEach(adapter -> log.info("  - {}", adapter.getClass().getSimpleName()));
    }

    @Override
    public SecretResolver forNamespace(String namespace) {
        return key -> {
            for (var adapter : chain) {
                var found = adapter.resolve(namespace, key);
                if (found.isPresent()) return found;
            }
            return Optional.empty();
        };
    }
}
