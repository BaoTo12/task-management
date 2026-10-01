package com.taskflow.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Date;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

/** PROVIDED: one row of the append-only security log (V1: audit_events). No setters: an event never changes. */
@Entity
@Table(name = "audit_events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuditEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String type;
  private String username;
  private String ip;
  @CreationTimestamp                   // Hibernate sets it on INSERT
  private Instant at;
  private String details;

  public AuditEvent(String type, String username, String ip, String details) {
    this.type = type;
    this.username = username == null ? null : username.substring(0, Math.min(50, username.length()));
    this.ip = ip;
    this.details = details;
  }

  /** For <fmt:formatDate>, which (even in JSTL 3.0) only formats java.util.Date. */
  public Date getAtDate() {
    return at == null ? null : Date.from(at);
  }
}
