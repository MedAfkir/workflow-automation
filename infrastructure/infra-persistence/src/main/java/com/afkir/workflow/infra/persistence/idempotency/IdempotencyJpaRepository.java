package com.afkir.workflow.infra.persistence.idempotency;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface IdempotencyJpaRepository extends JpaRepository<IdempotencyEntity, String> {

    @Modifying
    @Query("DELETE FROM IdempotencyEntity i WHERE i.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);
}
