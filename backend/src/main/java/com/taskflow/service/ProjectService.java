package com.taskflow.service;

import com.taskflow.dto.view.ProjectSummary;
import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectMember;
import com.taskflow.entity.ProjectMemberId;
import com.taskflow.entity.ProjectRole;
import com.taskflow.entity.User;
import com.taskflow.event.ProjectEvents;
import com.taskflow.exception.DuplicateException;
import com.taskflow.exception.FieldValidationException;
import com.taskflow.exception.ForbiddenException;
import com.taskflow.exception.NotFoundException;
import com.taskflow.repository.ProjectMemberRepository;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.repository.TaskRepository;
import com.taskflow.repository.UserRepository;
import com.taskflow.repository.projection.IdCount;
import com.taskflow.security.AuthUser;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Projects and their members. The rules (ProjectRole):
 *   see the project and its members     any member (VIEWER+)
 *   rename, recolour, manage members     MAINTAINER+ (only an OWNER may grant or take away OWNER)
 *   archive, delete                      OWNER
 * An admin counts as an OWNER everywhere. To a non-member a project doesn't exist (404, never 403).
 * A project always keeps at least one OWNER.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProjectService {

  /** What a PATCH may change: null = leave as is. */
  public record Patch(String name, String description, String color, Boolean archived) {}

  private final ProjectRepository projects;
  private final ProjectMemberRepository members;
  private final UserRepository users;
  private final TaskRepository tasks;
  private final ApplicationEventPublisher events;

  public List<ProjectSummary> list(AuthUser caller) {
    List<Project> visible = caller.isAdmin() ? projects.findAllByOrderByNameAsc() : projects.findForMember(caller.getId());
    Map<Long, Long> counts = members.countByProject().stream().collect(Collectors.toMap(IdCount::getId, IdCount::getCount));
    Map<Long, ProjectRole> myRoles = members.findByIdUserId(caller.getId()).stream()
        .collect(Collectors.toMap(ProjectMember::getProjectId, ProjectMember::getRole));
    return visible.stream()
        .map(p -> new ProjectSummary(p, caller.isAdmin() ? ProjectRole.OWNER : myRoles.get(p.getId()),
            counts.getOrDefault(p.getId(), 0L)))
        .toList();
  }

  public ProjectSummary get(long id, AuthUser caller) {
    Project project = find(id);
    ProjectRole role = require(project, caller, ProjectRole.VIEWER);
    return new ProjectSummary(project, role, members.findByIdProjectIdOrderByJoinedAtAsc(id).size());
  }

  @Transactional
  public ProjectSummary create(AuthUser caller, String name, String description, String color) {
    Project project;
    try {
      project = projects.saveAndFlush(new Project(name, description, color, caller.getId()));
    } catch (DataIntegrityViolationException e) {
      throw new DuplicateException("name", "you already have a project with this name");
    }
    members.save(new ProjectMember(project.getId(), caller.getId(), ProjectRole.OWNER));
    events.publishEvent(new ProjectEvents.Created(project.getId(), project.getName(), caller.getId()));
    return new ProjectSummary(project, ProjectRole.OWNER, 1);
  }

  @Transactional
  public ProjectSummary update(long id, AuthUser caller, Patch patch) {
    Project project = find(id);
    ProjectRole role = require(project, caller, ProjectRole.MAINTAINER);
    if (patch.archived() != null && !role.atLeast(ProjectRole.OWNER)) throw ForbiddenException.insufficientRole("archive project " + id);
    if (patch.name() != null) project.setName(patch.name());
    if (patch.description() != null) project.setDescription(patch.description());
    if (patch.color() != null) project.setColor(patch.color());
    if (patch.archived() != null) project.setArchived(patch.archived());
    try {
      projects.saveAndFlush(project);
    } catch (DataIntegrityViolationException e) {
      throw new DuplicateException("name", "the owner already has a project with this name");
    }
    events.publishEvent(new ProjectEvents.Updated(id, project.getName(), caller.getId()));
    return new ProjectSummary(project, role, members.findByIdProjectIdOrderByJoinedAtAsc(id).size());
  }

  /** Its tasks stay, without a project (tasks.project_id: ON DELETE SET NULL); memberships go (CASCADE). */
  @Transactional
  public void delete(long id, AuthUser caller) {
    Project project = find(id);
    require(project, caller, ProjectRole.OWNER);
    projects.delete(project);
  }

  public List<ProjectMember> members(long id, AuthUser caller) {
    require(find(id), caller, ProjectRole.VIEWER);
    return members.findByIdProjectIdOrderByJoinedAtAsc(id);
  }

  /** Adds the user, or changes their role (PUT: the same request twice gives the same result). */
  @Transactional
  public ProjectMember putMember(long id, AuthUser caller, long userId, ProjectRole role) {
    Project project = find(id);
    ProjectRole callerRole = require(project, caller, ProjectRole.MAINTAINER);
    User user = users.findById(userId).filter(User::isEnabled)
        .orElseThrow(() -> FieldValidationException.of("userId", "unknown user"));
    Optional<ProjectMember> existing = members.findById(new ProjectMemberId(id, userId));
    boolean touchesOwner = role == ProjectRole.OWNER || existing.map(m -> m.getRole() == ProjectRole.OWNER).orElse(false);
    if (touchesOwner && !callerRole.atLeast(ProjectRole.OWNER)) throw ForbiddenException.insufficientRole("manage owners of project " + id);
    if (userId == caller.getId() && !caller.isAdmin()) throw FieldValidationException.of("userId", "you can't change your own role");

    if (existing.isPresent()) {
      ProjectMember member = existing.get();
      if (member.getRole() == ProjectRole.OWNER && role != ProjectRole.OWNER) requireAnotherOwner(id);
      member.setRole(role);
      events.publishEvent(new ProjectEvents.MemberRoleChanged(id, project.getName(), userId, user.getUsername(), role, caller.getId()));
      return member;
    }
    ProjectMember member = members.save(new ProjectMember(id, userId, role));
    events.publishEvent(new ProjectEvents.MemberAdded(id, project.getName(), userId, user.getUsername(), role, caller.getId()));
    return member;
  }

  /** A MAINTAINER removes others; anyone may leave by removing themselves. Their tasks in it become unassigned. */
  @Transactional
  public void removeMember(long id, AuthUser caller, long userId) {
    Project project = find(id);
    boolean leaving = userId == caller.getId();
    ProjectRole callerRole = require(project, caller, leaving ? ProjectRole.VIEWER : ProjectRole.MAINTAINER);
    ProjectMember member = members.findById(new ProjectMemberId(id, userId))
        .orElseThrow(() -> new NotFoundException("Member not found"));
    if (member.getRole() == ProjectRole.OWNER) {
      if (!leaving && !callerRole.atLeast(ProjectRole.OWNER)) throw ForbiddenException.insufficientRole("remove an owner of project " + id);
      requireAnotherOwner(id);
    }
    members.delete(member);
    tasks.unassignInProject(id, userId);
    String username = users.findById(userId).map(User::getUsername).orElse("?");
    events.publishEvent(new ProjectEvents.MemberRemoved(id, project.getName(), userId, username, caller.getId()));
  }

  // ── Rules ─────────────────────────────────────────────────────────────────────────────────────────────────

  private Project find(long id) {
    return projects.findById(id).orElseThrow(() -> new NotFoundException("Project not found"));
  }

  /** The caller's effective role, or an exception: not a member → 404 (hide it), too weak a role → 403. */
  private ProjectRole require(Project project, AuthUser caller, ProjectRole minimum) {
    if (caller.isAdmin()) return ProjectRole.OWNER;
    ProjectRole role = members.findRole(project.getId(), caller.getId())
        .orElseThrow(() -> new NotFoundException("Project not found"));
    if (!role.atLeast(minimum)) throw ForbiddenException.insufficientRole(minimum + " needed in project " + project.getId());
    return role;
  }

  private void requireAnotherOwner(long projectId) {
    if (members.countByIdProjectIdAndRole(projectId, ProjectRole.OWNER) <= 1) {
      throw FieldValidationException.of("role", "a project needs at least one owner");
    }
  }
}
