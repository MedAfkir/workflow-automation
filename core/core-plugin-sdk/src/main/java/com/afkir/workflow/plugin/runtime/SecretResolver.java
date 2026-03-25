
package com.afkir.workflow.plugin.runtime;

import java.util.Optional;


public interface SecretResolver {

    
    Optional<String> resolve(String key);

    
    default String require(String key) {
        return resolve(key).orElseThrow(() ->
            new IllegalStateException("Required secret not found: " + key));
    }
}