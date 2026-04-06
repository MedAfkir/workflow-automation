package com.afkir.workflow.api.info;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.info.BuildProperties;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/info")
public class InfoController {

    private final BuildProperties buildProperties;
    private final Environment environment;
    private final String description;

    public InfoController(
            BuildProperties buildProperties,
            Environment environment,
            @Value("${info.app.description:}") String description) {
        this.buildProperties = buildProperties;
        this.environment = environment;
        this.description = description;
    }

    @GetMapping
    public ProjectInfoResponse get() {
        var profiles = environment.getActiveProfiles();
        var env = profiles.length == 0 ? "default" : String.join(",", profiles);
        return new ProjectInfoResponse(
                buildProperties.getName(),
                buildProperties.getVersion(),
                description,
                buildProperties.getTime(),
                env,
                buildProperties.getGroup(),
                buildProperties.getArtifact()
        );
    }
}
