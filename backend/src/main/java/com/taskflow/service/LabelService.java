package com.taskflow.service;

import com.taskflow.entity.Label;
import com.taskflow.exception.DuplicateException;
import com.taskflow.exception.ForbiddenException;
import com.taskflow.exception.NotFoundException;
import com.taskflow.repository.LabelRepository;
import com.taskflow.security.AuthUser;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Labels are shared: anyone may create one and put it on tasks they can edit (TaskService.setLabels). Renaming or
 * deleting a label changes it on EVERY task, so only its creator or an admin may do that.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class LabelService {

  private final LabelRepository labels;

  public List<Label> list() {
    return labels.findAllByOrderByNameAsc();
  }

  @Transactional
  public Label create(AuthUser caller, String name, String color) {
    try {
      return labels.saveAndFlush(new Label(name, color, caller.getId()));
    } catch (DataIntegrityViolationException e) {
      throw new DuplicateException("name", "a label with this name already exists");
    }
  }

  @Transactional
  public Label update(long id, AuthUser caller, String name, String color) {
    Label label = owned(id, caller);
    if (name != null) label.setName(name);
    if (color != null) label.setColor(color);
    try {
      return labels.saveAndFlush(label);
    } catch (DataIntegrityViolationException e) {
      throw new DuplicateException("name", "a label with this name already exists");
    }
  }

  /** Removes it from every task too (task_labels: ON DELETE CASCADE). */
  @Transactional
  public void delete(long id, AuthUser caller) {
    labels.delete(owned(id, caller));
  }

  private Label owned(long id, AuthUser caller) {
    Label label = labels.findById(id).orElseThrow(() -> new NotFoundException("Label not found"));
    if (!caller.isAdmin() && !Objects.equals(label.getCreatedBy(), caller.getId())) {
      throw ForbiddenException.insufficientRole("change label " + id);
    }
    return label;
  }
}
