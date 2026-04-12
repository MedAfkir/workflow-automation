package com.afkir.workflow.app.web;

import java.time.Instant;

public record ApiError(String code, String message, Instant timestamp) {
}