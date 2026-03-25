
package com.afkir.workflow.plugin.runtime;


public interface PluginLogger {
    void trace(String message);
    void debug(String message);
    void info(String message);
    void warn(String message);
    void error(String message);
    void error(String message, Throwable cause);

    
    void info(String format, Object... args);
    void warn(String format, Object... args);
    void error(String format, Object... args);
}