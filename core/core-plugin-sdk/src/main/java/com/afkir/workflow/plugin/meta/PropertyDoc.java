package com.afkir.workflow.plugin.meta;

import java.lang.annotation.*;

@Documented
@Target({ElementType.RECORD_COMPONENT, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface PropertyDoc {

    String description() default "";

    String format() default "";

    String defaultValue() default "";
}
