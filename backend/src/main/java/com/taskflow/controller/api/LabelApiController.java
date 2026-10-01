package com.taskflow.controller.api;

import com.taskflow.dto.request.LabelPatchRequest;
import com.taskflow.dto.request.LabelRequest;
import com.taskflow.dto.response.LabelDto;
import com.taskflow.security.AuthUser;
import com.taskflow.service.LabelService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** GET/POST /api/labels, PATCH/DELETE /api/labels/{id} (creator or admin). Put labels on a task: PUT /api/tasks/{id}/labels. */
@RestController
@RequestMapping("/api/labels")
@RequiredArgsConstructor
public class LabelApiController {

  private final LabelService labels;

  @GetMapping
  List<LabelDto> list() {
    return labels.list().stream().map(LabelDto::from).toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  LabelDto create(@Valid @RequestBody LabelRequest body, @AuthenticationPrincipal AuthUser user) {
    return LabelDto.from(labels.create(user, body.name().strip(), body.color()));
  }

  @PatchMapping("/{id}")
  LabelDto update(@PathVariable long id, @Valid @RequestBody LabelPatchRequest body, @AuthenticationPrincipal AuthUser user) {
    return LabelDto.from(labels.update(id, user, body.name() == null ? null : body.name().strip(), body.color()));
  }

  @DeleteMapping("/{id}")
  ResponseEntity<Void> delete(@PathVariable long id, @AuthenticationPrincipal AuthUser user) {
    labels.delete(id, user);
    return ResponseEntity.noContent().build();
  }
}
