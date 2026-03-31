package com.afkir.workflow.infra.secrets.adapter;

import com.afkir.workflow.infra.secrets.NamespacedSecretResolver;
import com.afkir.workflow.infra.secrets.crypto.AesGcmEncryptor;
import com.afkir.workflow.infra.secrets.crypto.EncryptedSecret;
import com.afkir.workflow.infra.secrets.persistence.SecretJpaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
@Order(2)
public class DbSecretResolver implements NamespacedSecretResolver {

    private static final Logger log = LoggerFactory.getLogger(DbSecretResolver.class);

    private final SecretJpaRepository repository;
    private final AesGcmEncryptor encryptor;

    public DbSecretResolver(SecretJpaRepository repository, AesGcmEncryptor encryptor) {
        this.repository = repository;
        this.encryptor = encryptor;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> resolve(String namespace, String key) {
        return repository.findByNamespaceAndKeyName(namespace, key)
                .map(entity -> {
                    var encrypted = new EncryptedSecret(entity.getIv(), entity.getCiphertext());
                    var plaintext = encryptor.decrypt(encrypted, namespace, key);
                    log.debug("Resolved secret {}:{} from database (version {})",
                            namespace, key, entity.getVersion());
                    return plaintext;
                });
    }
}
