package com.taskflow.dto.response;

import com.taskflow.entity.User;

/**
 * Who is logged in (/api/auth/me, the login response). No email, no password hash, no "enabled": an entity is never
 * serialised directly, so a field added to it later can't leak into every response.
 * DTOs are RECORDS: immutable, with equals/hashCode/toString for free (Java's own "Lombok @Value").
 */
public record UserDto(long id, String username, String displayName, String role, String locale) {

  public static UserDto from(User u) {
    return new UserDto(u.getId(), u.getUsername(), u.getDisplayName(), u.getRole(), u.getLocale() == null ? "en" : u.getLocale());
  }
}
