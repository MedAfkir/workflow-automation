package com.afkir.workflow.app.plugin;

import com.afkir.workflow.plugin.runtime.PluginLogger;
import org.slf4j.helpers.MessageFormatter;

import java.util.ArrayList;
import java.util.List;

class TestPluginLogger implements PluginLogger {
    private final List<String> messages = new ArrayList<>();

    public List<String> messages() {
        return List.copyOf(messages);
    }

    @Override
    public void trace(String m) {
        messages.add("[TRACE] " + m);
    }

    @Override
    public void debug(String m) {
        messages.add("[DEBUG] " + m);
    }

    @Override
    public void info(String m) {
        messages.add("[INFO] " + m);
    }

    @Override
    public void warn(String m) {
        messages.add("[WARN] " + m);
    }

    @Override
    public void error(String m) {
        messages.add("[ERROR] " + m);
    }

    @Override
    public void error(String m, Throwable t) {
        messages.add("[ERROR] " + m + " :: " + t.getMessage());
    }

    @Override
    public void info(String f, Object... a) {
        info(format(f, a));
    }

    @Override
    public void warn(String f, Object... a) {
        warn(format(f, a));
    }

    @Override
    public void error(String f, Object... a) {
        error(format(f, a));
    }

    private static String format(String f, Object... a) {
        return MessageFormatter.arrayFormat(f, a).getMessage();
    }

}