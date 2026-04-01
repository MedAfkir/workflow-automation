package com.afkir.workflow.infra.secrets.vault;

import com.afkir.workflow.infra.secrets.NamespacedSecretResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.vault.core.VaultTemplate;

import java.util.Map;
import java.util.Optional;

@Component
@ConditionalOnProperty(name = "workflow.secrets.vault.enabled", havingValue = "true")
@Order(3)
public class VaultSecretResolver implements NamespacedSecretResolver {

    private static final Logger log = LoggerFactory.getLogger(VaultSecretResolver.class);

    private final VaultTemplate vaultTemplate;
    private final String basePath;

    public VaultSecretResolver(VaultTemplate vaultTemplate,
                               @Value("${workflow.secrets.vault.base-path:secret/data/workflow}")
                               String basePath) {
        this.vaultTemplate = vaultTemplate;
        this.basePath = basePath;
        log.info("VaultSecretResolver enabled, base path = {}", basePath);
    }

    @Override
    public Optional<String> resolve(String namespace, String key) {
        var path = basePath + "/" + namespace + "/" + key;
        try {
            var response = vaultTemplate.read(path);
            if (response == null || response.getData() == null) {
                return Optional.empty();
            }
            
            var data = response.getData().get("data");
            if (!(data instanceof Map<?, ?> dataMap)) {
                return Optional.empty();
            }
            var value = dataMap.get("value");
            if (value == null) return Optional.empty();
            log.debug("Resolved secret {}:{} from Vault", namespace, key);
            return Optional.of(value.toString());
        } catch (Exception e) {
            log.warn("Vault read failed for {}: {}", path, e.getMessage());
            return Optional.empty();
        }
    }
}
