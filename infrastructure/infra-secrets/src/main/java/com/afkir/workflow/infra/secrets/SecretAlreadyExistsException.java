package com.afkir.workflow.infra.secrets;

public class SecretAlreadyExistsException extends RuntimeException {
    public SecretAlreadyExistsException(String namespace, String key) {
        super("Secret already exists: " + namespace + ":" + key);
    }
}
