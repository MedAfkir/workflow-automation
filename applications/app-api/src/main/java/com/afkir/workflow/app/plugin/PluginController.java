package com.afkir.workflow.app.plugin;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/v1/plugins")
public class PluginController {

    private final PluginCatalogService catalog;

    public PluginController(PluginCatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping
    public ResponseEntity<List<PluginDescriptor>> list(
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {

        var snapshot = catalog.snapshot();
        var etag = snapshot.etag();

        if (etag.equals(ifNoneMatch)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).build();
        }

        return ResponseEntity.ok()
                .eTag(etag)
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic())
                .body(snapshot.descriptors());
    }
}
