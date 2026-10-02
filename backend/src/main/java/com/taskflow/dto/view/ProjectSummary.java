package com.taskflow.dto.view;

import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectRole;

/**
 * A project plus what the CALLER needs to know about it: their own role and how many members it has.
 * The JavaBean getters are for the JSPs (${summary.project.name} in tasks/form.jsp): Tomcat 10.1's EL 5.0 reads
 * getProject(), NOT the record accessor project() (records are only understood from EL 6.0 / Tomcat 11). Same as PageView.
 */
public record ProjectSummary(Project project, ProjectRole myRole, long memberCount) {

  public Project getProject() { return project; }
  public ProjectRole getMyRole() { return myRole; }
  public long getMemberCount() { return memberCount; }
}
