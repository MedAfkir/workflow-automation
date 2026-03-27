package com.afkir.workflow.infra.persistence.workflow;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface WorkflowJpaRepository extends JpaRepository<WorkflowEntity, UUID> {
    Optional<WorkflowEntity> findByNamespaceAndKey(String namespace, String key);

    boolean existsByNamespaceAndKey(String namespace, String key);
}