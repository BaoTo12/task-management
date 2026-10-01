package com.taskflow.dto.response;

import com.taskflow.entity.ProjectMember;
import com.taskflow.entity.ProjectRole;
import java.time.Instant;

/** A membership: only ids. The SPA joins it with its normalised users (GET /api/users?ids=…) in a selector. */
public record MemberDto(long projectId, long userId, ProjectRole role, Instant joinedAt) {

  public static MemberDto from(ProjectMember m) {
    return new MemberDto(m.getProjectId(), m.getUserId(), m.getRole(), m.getJoinedAt());
  }
}
