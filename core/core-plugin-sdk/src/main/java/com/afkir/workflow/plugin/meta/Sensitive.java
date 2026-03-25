package com.afkir.workflow.plugin.meta;

import com.afkir.workflow.plugin.runtime.SecretResolver;

import java.lang.annotation.*;


@Documented
@Target({ElementType.RECORD_COMPONENT, ElementType.FIELD, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface Sensitive {
}