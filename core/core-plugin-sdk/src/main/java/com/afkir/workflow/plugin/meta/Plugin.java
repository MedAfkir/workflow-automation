package com.afkir.workflow.plugin.meta;

import java.lang.annotation.*;


@Documented
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Plugin {

    
    String id();

    
    String version();

    
    String description() default "";

    
    PluginType type() default PluginType.AUTO;

    
    String[] categories() default {};

    
    boolean deprecated() default false;

    
    String replacedBy() default "";
}