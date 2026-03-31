package com.afkir.workflow.infra.secrets.crypto;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

@Configuration
public class MasterKeyConfig {

    private static final Logger log = LoggerFactory.getLogger(MasterKeyConfig.class);

    @Bean
    public SecretKey workflowSecretMasterKey(
            @Value("${workflow.secrets.master-key:}") String configKey) {
        byte[] keyBytes;
        if (configKey == null || configKey.isBlank()) {
            log.warn("No WORKFLOW_SECRET_MASTER_KEY set - generating an EPHEMERAL key. " +
                    "All DB-encrypted secrets will become UNREADABLE on restart. " +
                    "Set the env var for any persistent deployment.");
            keyBytes = new byte[32];
            new SecureRandom().nextBytes(keyBytes);
        } else {
            try {
                keyBytes = Base64.getDecoder().decode(configKey);
            } catch (IllegalArgumentException e) {
                throw new IllegalStateException(
                        "WORKFLOW_SECRET_MASTER_KEY is not valid base64", e);
            }
            if (keyBytes.length != 32) {
                throw new IllegalStateException(
                        "WORKFLOW_SECRET_MASTER_KEY must decode to exactly 32 bytes (256 bits); got "
                                + keyBytes.length);
            }
            log.info("Master key loaded from configuration ({} bytes).", keyBytes.length);
        }
        return new SecretKeySpec(keyBytes, "AES");
    }
}
