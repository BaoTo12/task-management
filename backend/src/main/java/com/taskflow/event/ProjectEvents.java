package com.taskflow.event;

import com.taskflow.entity.ProjectRole;

/** Events about projects and their members, published by ProjectService. */
public final class ProjectEvents {

  private ProjectEvents() {}

  public record Created(long projectId, String name, long actorId) {}

  public record Updated(long projectId, String name, long actorId) {}

  public record MemberAdded(long projectId, String projectName, long userId, String username, ProjectRole role,
                            long actorId) {}

  public record MemberRoleChanged(long projectId, String projectName, long userId, String username, ProjectRole role,
                                  long actorId) {}

  public record MemberRemoved(long projectId, String projectName, long userId, String username, long actorId) {}
}
