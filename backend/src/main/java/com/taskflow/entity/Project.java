package com.taskflow.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/** PROVIDED: a project (V3: projects). Members and their roles are ProjectMember rows. */
@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Project {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Setter(AccessLevel.NONE)
  private Long id;
  private String name;
  private String description = "";
  private String color = "#2563eb";
  @Column(name = "owner_id", updatable = false)
  @Setter(AccessLevel.NONE)            // who created it never changes
  private long ownerId;
  private boolean archived;
  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  @Setter(AccessLevel.NONE)
  private Instant createdAt;

  public Project(String name, String description, String color, long ownerId) {
    this.name = name;
    this.description = description;
    this.color = color;
    this.ownerId = ownerId;
  }
}
