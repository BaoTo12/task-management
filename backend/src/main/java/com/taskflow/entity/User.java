package com.taskflow.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * PROVIDED: a user account (V1: users) WITHOUT the password hash. The column isn't mapped, so it can't leak through a
 * page or a JSON response; UserRepository.findCredentials is the one query that reads it.
 * EL reads it through getters: ${account.displayName}, ${account.admin} → isAdmin().
 * Accounts come from the seed migration only (no sign-up in TaskFlow): getters, no setters.
 *
 * Lombok: @Getter writes a getter per field at compile time (isEnabled() for the boolean); @NoArgsConstructor(PROTECTED)
 * is the constructor JPA needs, hidden from application code. Entities never use @Data: its equals/hashCode over every
 * field breaks Hibernate's proxies and collections, and its toString can trigger lazy loading.
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

  @Id
  private Long id;
  private String username;
  private String email;
  @Column(name = "display_name")
  private String displayName;
  private String role;                 // 'USER' | 'ADMIN'
  private String locale;               // 'en' | 'vi'
  private boolean enabled;
  @Column(name = "created_at", insertable = false, updatable = false)
  private Instant createdAt;

  public boolean isAdmin() {
    return "ADMIN".equals(role);
  }
}
