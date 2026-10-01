package com.taskflow.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * PROVIDED: the COMPOSITE primary key of project_members (project_id, user_id). JPA requires an id class to be
 * Serializable and to implement equals/hashCode BY VALUE: two keys with the same ids are the same membership.
 * Here @EqualsAndHashCode is right (unlike on an entity): an id is a value object.
 */
@Embeddable
@Getter
@EqualsAndHashCode
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectMemberId implements Serializable {

  private static final long serialVersionUID = 1L;

  @Column(name = "project_id")
  private long projectId;
  @Column(name = "user_id")
  private long userId;
}
