package com.afkir.workflow.infra.secrets.crypto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AesGcmEncryptorTest {

    private AesGcmEncryptor encryptor;
    private SecretKey masterKey;

    @BeforeEach
    void setUp() {
        var keyBytes = new byte[32];
        new SecureRandom().nextBytes(keyBytes);
        masterKey = new SecretKeySpec(keyBytes, "AES");
        encryptor = new AesGcmEncryptor(masterKey);
    }

    @Test
    void encrypt_then_decrypt_yields_original_plaintext() {
        var encrypted = encryptor.encrypt("super-secret-value", "demo", "STRIPE_KEY");

        var decrypted = encryptor.decrypt(encrypted, "demo", "STRIPE_KEY");

        assertThat(decrypted).isEqualTo("super-secret-value");
    }

    @Test
    void encrypt_uses_a_fresh_iv_every_time() {
        var first = encryptor.encrypt("value", "demo", "KEY");
        var second = encryptor.encrypt("value", "demo", "KEY");

        assertThat(first.iv()).isNotEqualTo(second.iv());
        assertThat(first.ciphertext()).isNotEqualTo(second.ciphertext());
    }

    @Test
    void iv_is_always_12_bytes() {
        var encrypted = encryptor.encrypt("value", "demo", "KEY");

        assertThat(encrypted.iv()).hasSize(12);
    }

    @Test
    void decrypt_with_swapped_namespace_fails() {
        
        var encrypted = encryptor.encrypt("prod-value", "prod", "STRIPE_KEY");

        assertThatThrownBy(() -> encryptor.decrypt(encrypted, "dev", "STRIPE_KEY"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Failed to decrypt");
    }

    @Test
    void decrypt_with_swapped_key_fails() {
        var encrypted = encryptor.encrypt("password-A", "demo", "KEY_A");

        assertThatThrownBy(() -> encryptor.decrypt(encrypted, "demo", "KEY_B"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void decrypt_with_wrong_master_key_fails() {
        var encrypted = encryptor.encrypt("value", "demo", "KEY");

        var otherKeyBytes = new byte[32];
        new SecureRandom().nextBytes(otherKeyBytes);
        var otherEncryptor = new AesGcmEncryptor(new SecretKeySpec(otherKeyBytes, "AES"));

        assertThatThrownBy(() -> otherEncryptor.decrypt(encrypted, "demo", "KEY"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void decrypt_with_tampered_ciphertext_fails() {
        var encrypted = encryptor.encrypt("value", "demo", "KEY");
        var tampered = encrypted.ciphertext().clone();
        tampered[0] ^= 0xFF;
        var tamperedSecret = new EncryptedSecret(encrypted.iv(), tampered);

        assertThatThrownBy(() -> encryptor.decrypt(tamperedSecret, "demo", "KEY"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void encrypt_handles_unicode_correctly() {
        var unicode = "secret with émoji and accénts";

        var encrypted = encryptor.encrypt(unicode, "demo", "UNICODE_KEY");
        var decrypted = encryptor.decrypt(encrypted, "demo", "UNICODE_KEY");

        assertThat(decrypted).isEqualTo(unicode);
    }

    @Test
    void encrypted_secret_record_validates_iv_length() {
        assertThatThrownBy(() -> new EncryptedSecret(new byte[10], new byte[16]))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("IV must be 12 bytes");
    }

    @Test
    void encrypted_secret_record_validates_non_empty_ciphertext() {
        assertThatThrownBy(() -> new EncryptedSecret(new byte[12], new byte[0]))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("ciphertext must not be empty");
    }
}
