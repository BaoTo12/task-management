package com.taskflow.entity;

/**
 * A member's role in a project, strongest first (the ORDINAL is the rank):
 *   OWNER       everything, including deleting the project and making other owners
 *   MAINTAINER  edit the project, manage members (not owners), delete tasks
 *   MEMBER      create, edit and be assigned tasks; comment; track time
 *   VIEWER      read only
 */
public enum ProjectRole {
  OWNER,
  MAINTAINER,
  MEMBER,
  VIEWER;

  /** OWNER.atLeast(MEMBER) is true; VIEWER.atLeast(MEMBER) is false. */
  public boolean atLeast(ProjectRole required) {
    return ordinal() <= required.ordinal();
  }

  public static ProjectRole parse(String value) {
    if (value == null) return null;
    for (ProjectRole role : values()) {
      if (role.name().equals(value)) return role;
    }
    return null;
  }
}
