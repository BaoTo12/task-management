package com.taskflow.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/** PROVIDED: "user U is a MEMBER of project P since …" (V3: project_members). Only the role can change. */
@Entity
@Table(name = "project_members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectMember {

  @EmbeddedId
  private ProjectMemberId id;
  @Enumerated(EnumType.STRING)
  @Setter
  private ProjectRole role;
  @CreationTimestamp
  @Column(name = "joined_at", updatable = false)
  private Instant joinedAt;

  public ProjectMember(long projectId, long userId, ProjectRole role) {
    this.id = new ProjectMemberId(projectId, userId);
    this.role = role;
  }

  public long getProjectId() {
    return id.getProjectId();
  }

  public long getUserId() {
    return id.getUserId();
  }
}
