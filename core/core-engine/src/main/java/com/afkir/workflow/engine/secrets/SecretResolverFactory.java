package com.afkir.workflow.engine.secrets;

import com.afkir.workflow.plugin.runtime.SecretResolver;

public interface SecretResolverFactory {

    SecretResolver forNamespace(String namespace);
}
