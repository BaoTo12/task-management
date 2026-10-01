package com.taskflow.dto.response;

import com.taskflow.dto.view.ProjectSummary;
import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectRole;
import java.time.Instant;

/** A project as the caller sees it: myRole drives which buttons the SPA shows (the server checks again anyway). */
public record ProjectDto(long id, String name, String description, String color, long ownerId, boolean archived,
                         Instant createdAt, ProjectRole myRole, long memberCount) {

  public static ProjectDto from(ProjectSummary summary) {
    Project p = summary.project();
    return new ProjectDto(p.getId(), p.getName(), p.getDescription(), p.getColor(), p.getOwnerId(), p.isArchived(),
        p.getCreatedAt(), summary.myRole(), summary.memberCount());
  }
}
