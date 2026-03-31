package com.afkir.workflow.infra.secrets;

import java.util.Optional;

public interface NamespacedSecretResolver {

    Optional<String> resolve(String namespace, String key);
}
