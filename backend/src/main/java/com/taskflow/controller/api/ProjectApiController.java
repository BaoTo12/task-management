package com.taskflow.controller.api;

import com.taskflow.dto.request.MemberRequest;
import com.taskflow.dto.request.ProjectPatchRequest;
import com.taskflow.dto.request.ProjectRequest;
import com.taskflow.dto.response.MemberDto;
import com.taskflow.dto.response.ProjectDto;
import com.taskflow.security.AuthUser;
import com.taskflow.service.ProjectService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 *   GET    /api/projects                          → [ProjectDto] the caller is a member of (all for an admin)
 *   POST   /api/projects                          → 201 ProjectDto (the caller becomes its OWNER)
 *   GET    /api/projects/{id}                     → ProjectDto
 *   PATCH  /api/projects/{id}                     → ProjectDto  (MAINTAINER+; archived: OWNER)
 *   DELETE /api/projects/{id}                     → 204         (OWNER)
 *   GET    /api/projects/{id}/members             → [MemberDto]
 *   PUT    /api/projects/{id}/members/{userId}    → MemberDto   {"role":"MEMBER"}: add, or change the role
 *   DELETE /api/projects/{id}/members/{userId}    → 204         (remove, or leave when userId is yourself)
 */
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectApiController {

  private final ProjectService projects;

  @GetMapping
  List<ProjectDto> list(@AuthenticationPrincipal AuthUser user) {
    return projects.list(user).stream().map(ProjectDto::from).toList();
  }

  @PostMapping
  ResponseEntity<ProjectDto> create(@Valid @RequestBody ProjectRequest body, @AuthenticationPrincipal AuthUser user) {
    ProjectDto created = ProjectDto.from(projects.create(user, body.name(), body.description(), body.color()));
    URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(created.id()).toUri();
    return ResponseEntity.created(location).body(created);
  }

  @GetMapping("/{id}")
  ProjectDto get(@PathVariable long id, @AuthenticationPrincipal AuthUser user) {
    return ProjectDto.from(projects.get(id, user));
  }

  @PatchMapping("/{id}")
  ProjectDto update(@PathVariable long id, @Valid @RequestBody ProjectPatchRequest body,
                    @AuthenticationPrincipal AuthUser user) {
    ProjectService.Patch patch = new ProjectService.Patch(
        body.name() == null ? null : body.name().strip(), body.description(), body.color(), body.archived());
    return ProjectDto.from(projects.update(id, user, patch));
  }

  @DeleteMapping("/{id}")
  ResponseEntity<Void> delete(@PathVariable long id, @AuthenticationPrincipal AuthUser user) {
    projects.delete(id, user);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{id}/members")
  List<MemberDto> members(@PathVariable long id, @AuthenticationPrincipal AuthUser user) {
    return projects.members(id, user).stream().map(MemberDto::from).toList();
  }

  @PutMapping("/{id}/members/{userId}")
  MemberDto putMember(@PathVariable long id, @PathVariable long userId, @Valid @RequestBody MemberRequest body,
                      @AuthenticationPrincipal AuthUser user) {
    return MemberDto.from(projects.putMember(id, user, userId, body.role()));
  }

  @DeleteMapping("/{id}/members/{userId}")
  ResponseEntity<Void> removeMember(@PathVariable long id, @PathVariable long userId, @AuthenticationPrincipal AuthUser user) {
    projects.removeMember(id, user, userId);
    return ResponseEntity.noContent().build();
  }
}
