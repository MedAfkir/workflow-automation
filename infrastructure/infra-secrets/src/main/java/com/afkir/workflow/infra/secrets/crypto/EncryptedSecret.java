package com.afkir.workflow.infra.secrets.crypto;

public record EncryptedSecret(byte[] iv, byte[] ciphertext) {

    public EncryptedSecret {
        if (iv == null || iv.length != 12) {
            throw new IllegalArgumentException("IV must be 12 bytes (NIST SP 800-38D)");
        }
        if (ciphertext == null || ciphertext.length == 0) {
            throw new IllegalArgumentException("ciphertext must not be empty");
        }
    }
}
