package com.afkir.workflow.infra.secrets.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SecretJpaRepository extends JpaRepository<SecretEntity, UUID> {

    Optional<SecretEntity> findByNamespaceAndKeyName(String namespace, String keyName);

    List<SecretEntity> findByNamespaceOrderByKeyNameAsc(String namespace);

    boolean existsByNamespaceAndKeyName(String namespace, String keyName);

    void deleteByNamespaceAndKeyName(String namespace, String keyName);
}
