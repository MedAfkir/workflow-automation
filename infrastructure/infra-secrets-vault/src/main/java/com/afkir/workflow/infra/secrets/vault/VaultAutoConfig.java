package com.afkir.workflow.infra.secrets.vault;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.vault.authentication.AppRoleAuthentication;
import org.springframework.vault.authentication.AppRoleAuthenticationOptions;
import org.springframework.vault.authentication.ClientAuthentication;
import org.springframework.vault.client.VaultEndpoint;
import org.springframework.vault.config.AbstractVaultConfiguration;

import java.net.URI;

@Configuration
@ConditionalOnProperty(name = "workflow.secrets.vault.enabled", havingValue = "true")
public class VaultAutoConfig extends AbstractVaultConfiguration {

    @Value("${workflow.secrets.vault.uri:http://localhost:8200}")
    private URI uri;

    @Value("${workflow.secrets.vault.role-id:}")
    private String roleId;

    @Value("${workflow.secrets.vault.secret-id:}")
    private String secretId;

    @Override
    public VaultEndpoint vaultEndpoint() {
        return VaultEndpoint.from(uri);
    }

    @Override
    public ClientAuthentication clientAuthentication() {
        if (roleId == null || roleId.isBlank() || secretId == null || secretId.isBlank()) {
            throw new IllegalStateException(
                    "Vault is enabled (workflow.secrets.vault.enabled=true) but " +
                            "role-id or secret-id is missing. " +
                            "Set WORKFLOW_VAULT_ROLE_ID and WORKFLOW_VAULT_SECRET_ID.");
        }
        var options = AppRoleAuthenticationOptions.builder()
                .roleId(AppRoleAuthenticationOptions.RoleId.provided(roleId))
                .secretId(AppRoleAuthenticationOptions.SecretId.provided(secretId))
                .build();
        return new AppRoleAuthentication(options, restOperations());
    }
}
