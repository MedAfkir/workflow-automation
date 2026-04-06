
package com.afkir.workflow.app.config;

import com.afkir.workflow.infra.templating.ConfigResolver;
import com.afkir.workflow.infra.templating.TemplateEngine;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TemplatingConfig {

    @Bean
    public TemplateEngine templateEngine() {
        return new TemplateEngine();
    }

    @Bean
    public ConfigResolver configResolver(TemplateEngine engine) {
        return new ConfigResolver(engine);
    }

}