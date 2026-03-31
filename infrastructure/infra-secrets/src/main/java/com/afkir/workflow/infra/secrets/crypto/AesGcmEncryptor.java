package com.afkir.workflow.infra.secrets.crypto;

import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;

@Component
public class AesGcmEncryptor {

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final int IV_LENGTH_BYTES = 12;

    private final SecretKey masterKey;
    private final SecureRandom random = new SecureRandom();

    public AesGcmEncryptor(SecretKey masterKey) {
        this.masterKey = masterKey;
    }

    public EncryptedSecret encrypt(String plaintext, String namespace, String key) {
        try {
            var iv = new byte[IV_LENGTH_BYTES];
            random.nextBytes(iv);

            var cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, masterKey,
                    new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            cipher.updateAAD(buildAad(namespace, key));

            var ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            return new EncryptedSecret(iv, ciphertext);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Failed to encrypt secret " + namespace + ":" + key, e);
        }
    }

    public String decrypt(EncryptedSecret encrypted, String namespace, String key) {
        try {
            var cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, masterKey,
                    new GCMParameterSpec(GCM_TAG_LENGTH_BITS, encrypted.iv()));
            cipher.updateAAD(buildAad(namespace, key));

            var plaintext = cipher.doFinal(encrypted.ciphertext());
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(
                    "Failed to decrypt secret " + namespace + ":" + key
                            + " (wrong master key, tampered ciphertext, or namespace/key mismatch)", e);
        }
    }

    private static byte[] buildAad(String namespace, String key) {
        return (namespace + ":" + key).getBytes(StandardCharsets.UTF_8);
    }
}
