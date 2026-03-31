package com.afkir.workflow.infra.secrets;

public class SecretNotFoundException extends RuntimeException {
    public SecretNotFoundException(String namespace, String key) {
        super("Secret not found: " + namespace + ":" + key);
    }
}
