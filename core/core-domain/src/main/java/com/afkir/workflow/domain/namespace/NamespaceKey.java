package com.afkir.workflow.domain.namespace;

public record NamespaceKey(String namespace, String key) {

    private static final String VALID_PATTERN = "^[a-z0-9][a-z0-9_.-]{0,63}$";

    public NamespaceKey {
        if (namespace == null || !namespace.matches(VALID_PATTERN)) {
            throw new IllegalArgumentException("Invalid namespace: " + namespace);
        }

        if (key == null || !key.matches(VALID_PATTERN)) {
            throw new IllegalArgumentException("Invalid key: " + key);
        }
    }

    public String fullName() {
        return namespace + "/" + key;
    }

}
