package com.taskflow.service;

import com.taskflow.entity.ProjectRole;
import com.taskflow.entity.Task;
import com.taskflow.repository.ProjectMemberRepository;
import com.taskflow.repository.criteria.TaskSpecifications;
import com.taskflow.security.AuthUser;
import java.util.Objects;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

/**
 * THE access rules for tasks, in one place (a "policy" object). Every service asks here; no controller, filter or view
 * repeats a rule, so none can forget one, and changing a rule is a one-place change.
 *
 *                         view   edit   delete
 *   admin                  ✓      ✓      ✓
 *   owner                  ✓      ✓      ✓
 *   assignee               ✓      ✓
 *   project OWNER/MAINT.   ✓      ✓      ✓
 *   project MEMBER         ✓      ✓
 *   project VIEWER         ✓
 */
@Component
@RequiredArgsConstructor
public class TaskAccess {

  private final ProjectMemberRepository members;

  public boolean canView(Task task, AuthUser caller) {
    return caller.isAdmin() || isOwner(task, caller) || isAssignee(task, caller) || role(task, caller).isPresent();
  }

  public boolean canEdit(Task task, AuthUser caller) {
    return caller.isAdmin() || isOwner(task, caller) || isAssignee(task, caller)
        || role(task, caller).filter(r -> r.atLeast(ProjectRole.MEMBER)).isPresent();
  }

  public boolean canDelete(Task task, AuthUser caller) {
    return caller.isAdmin() || isOwner(task, caller)
        || role(task, caller).filter(r -> r.atLeast(ProjectRole.MAINTAINER)).isPresent();
  }

  /** The same "view" rule as a query condition, for lists and counts. */
  public Specification<Task> visible(AuthUser caller) {
    return TaskSpecifications.visibleTo(caller);
  }

  private static boolean isOwner(Task task, AuthUser caller) {
    return task.getOwnerId() == caller.getId();
  }

  private static boolean isAssignee(Task task, AuthUser caller) {
    return Objects.equals(task.getAssigneeId(), caller.getId());
  }

  private Optional<ProjectRole> role(Task task, AuthUser caller) {
    return task.getProjectId() == null ? Optional.empty() : members.findRole(task.getProjectId(), caller.getId());
  }
}
