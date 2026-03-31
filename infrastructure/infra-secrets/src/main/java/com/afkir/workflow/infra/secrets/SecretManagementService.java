package com.afkir.workflow.infra.secrets;

import com.afkir.workflow.infra.secrets.crypto.AesGcmEncryptor;
import com.afkir.workflow.infra.secrets.persistence.SecretEntity;
import com.afkir.workflow.infra.secrets.persistence.SecretJpaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class SecretManagementService {

    private static final Logger log = LoggerFactory.getLogger(SecretManagementService.class);

    private final SecretJpaRepository repository;
    private final AesGcmEncryptor encryptor;

    public SecretManagementService(SecretJpaRepository repository, AesGcmEncryptor encryptor) {
        this.repository = repository;
        this.encryptor = encryptor;
    }

    @Transactional
    public SecretSummary create(String namespace, String key, String plaintextValue) {
        if (repository.existsByNamespaceAndKeyName(namespace, key)) {
            throw new SecretAlreadyExistsException(namespace, key);
        }
        var encrypted = encryptor.encrypt(plaintextValue, namespace, key);
        var entity = new SecretEntity(
                UUID.randomUUID(), namespace, key,
                encrypted.iv(), encrypted.ciphertext(), 1
        );
        var saved = repository.save(entity);
        log.info("Created secret {}:{} (id={}, version=1)", namespace, key, saved.getId());
        return summary(saved);
    }

    @Transactional
    public SecretSummary rotate(String namespace, String key, String newPlaintextValue) {
        var entity = repository.findByNamespaceAndKeyName(namespace, key)
                .orElseThrow(() -> new SecretNotFoundException(namespace, key));
        var encrypted = encryptor.encrypt(newPlaintextValue, namespace, key);
        entity.setIv(encrypted.iv());
        entity.setCiphertext(encrypted.ciphertext());
        entity.setVersion(entity.getVersion() + 1);
        entity.setUpdatedAt(Instant.now());
        var saved = repository.save(entity);
        log.info("Rotated secret {}:{} (version {})", namespace, key, saved.getVersion());
        return summary(saved);
    }

    @Transactional(readOnly = true)
    public List<SecretSummary> list(String namespace) {
        return repository.findByNamespaceOrderByKeyNameAsc(namespace)
                .stream()
                .map(this::summary)
                .toList();
    }

    @Transactional
    public void delete(String namespace, String key) {
        if (!repository.existsByNamespaceAndKeyName(namespace, key)) {
            throw new SecretNotFoundException(namespace, key);
        }
        repository.deleteByNamespaceAndKeyName(namespace, key);
        log.info("Deleted secret {}:{}", namespace, key);
    }

    private SecretSummary summary(SecretEntity entity) {
        return new SecretSummary(
                entity.getId(),
                entity.getNamespace(),
                entity.getKeyName(),
                entity.getVersion(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public record SecretSummary(
            UUID id,
            String namespace,
            String key,
            int version,
            Instant createdAt,
            Instant updatedAt
    ) {
    }
}
