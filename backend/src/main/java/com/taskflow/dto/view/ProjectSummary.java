package com.taskflow.dto.view;

import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectRole;

/** A project plus what the CALLER needs to know about it: their own role and how many members it has. */
public record ProjectSummary(Project project, ProjectRole myRole, long memberCount) {}
