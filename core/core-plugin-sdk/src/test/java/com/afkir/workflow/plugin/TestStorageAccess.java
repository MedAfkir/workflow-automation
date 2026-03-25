package com.afkir.workflow.app.plugin;

import com.afkir.workflow.plugin.runtime.StorageAccess;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

class TestStorageAccess implements StorageAccess {
    private final Map<URI, byte[]> stored = new HashMap<>();

    public Map<URI, byte[]> stored() { return Map.copyOf(stored); }

    @Override
    public URI put(String filename, InputStream content) {
        try {
            var bytes = content.readAllBytes();
            var uri = URI.create("test-storage://" + UUID.randomUUID() + "/" + filename);
            stored.put(uri, bytes);
            return uri;
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    @Override
    public InputStream get(URI uri) {
        var bytes = stored.get(uri);
        if (bytes == null) throw new IllegalArgumentException("URI not found: " + uri);
        return new ByteArrayInputStream(bytes);
    }

    @Override
    public boolean exists(URI uri) { return stored.containsKey(uri); }
}