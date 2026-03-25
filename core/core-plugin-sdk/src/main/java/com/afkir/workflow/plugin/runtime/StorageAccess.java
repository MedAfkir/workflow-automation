package com.afkir.workflow.plugin.runtime;

import java.io.InputStream;
import java.net.URI;

public interface StorageAccess {

    URI put(String filename, InputStream content);

    InputStream get(URI uri);

    boolean exists(URI uri);
}
