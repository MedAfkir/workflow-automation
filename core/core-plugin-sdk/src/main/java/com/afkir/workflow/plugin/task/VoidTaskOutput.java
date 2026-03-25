package com.afkir.workflow.plugin.task;

public record VoidTaskOutput() implements TaskOutput {

    public static final VoidTaskOutput INSTANCE = new VoidTaskOutput();
}
