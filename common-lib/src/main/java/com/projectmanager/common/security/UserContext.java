package com.projectmanager.common.security;

import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public final class UserContext {

    private UserContext() {}

    public static CustomUserDetails getCurrentUser() {
        return (CustomUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }

    public static UUID getCurrentUserId() {
        return getCurrentUser().getId();
    }

    public static String getCurrentUsername() {
        return getCurrentUser().getUsername();
    }

    public static UUID getCurrentTenantId() {
        return getCurrentUser().getTenantId();
    }
}
