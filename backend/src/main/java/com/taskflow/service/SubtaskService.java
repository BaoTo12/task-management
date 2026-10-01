package com.taskflow.service;

import com.taskflow.entity.Subtask;
import com.taskflow.entity.Task;
import com.taskflow.event.TaskRef;
import com.taskflow.event.WorkEvents;
import com.taskflow.exception.FieldValidationException;
import com.taskflow.exception.NotFoundException;
import com.taskflow.repository.SubtaskRepository;
import com.taskflow.security.AuthUser;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** A task's checklist. Reading needs "view" on the task; every change needs "edit". */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class SubtaskService {

  /** What a PATCH may change: null = leave as is. */
  public record Patch(String title, Boolean done) {}

  private final TaskService tasks;
  private final SubtaskRepository subtasks;
  private final ApplicationEventPublisher events;

  public List<Subtask> list(long taskId, AuthUser caller) {
    tasks.requireVisible(taskId, caller);
    return subtasks.findByTaskIdOrderByPositionAscIdAsc(taskId);
  }

  @Transactional
  public Subtask add(long taskId, AuthUser caller, String title) {
    tasks.requireEditable(taskId, caller);
    return subtasks.save(new Subtask(taskId, title, subtasks.nextPosition(taskId)));
  }

  /** A MANAGED entity: changing its fields is enough, Hibernate writes the UPDATE at commit ("dirty checking"). */
  @Transactional
  public Subtask update(long subtaskId, AuthUser caller, Patch patch) {
    Subtask subtask = subtasks.findById(subtaskId).orElseThrow(() -> new NotFoundException("Subtask not found"));
    Task task = tasks.requireEditable(subtask.getTaskId(), caller);
    if (patch.title() != null) subtask.setTitle(patch.title());
    if (patch.done() != null) {
      boolean completedNow = patch.done() && !subtask.isDone();
      subtask.setDone(patch.done());
      if (completedNow) {
        events.publishEvent(new WorkEvents.SubtaskCompleted(TaskRef.of(task), caller.getId(), subtask.getTitle()));
      }
    }
    return subtask;
  }

  @Transactional
  public void delete(long subtaskId, AuthUser caller) {
    Subtask subtask = subtasks.findById(subtaskId).orElseThrow(() -> new NotFoundException("Subtask not found"));
    tasks.requireEditable(subtask.getTaskId(), caller);
    subtasks.delete(subtask);
  }

  /** Drag and drop: the full list of the task's subtask ids, in the new order. */
  @Transactional
  public List<Subtask> reorder(long taskId, AuthUser caller, List<Long> orderedIds) {
    tasks.requireEditable(taskId, caller);
    Map<Long, Subtask> byId = subtasks.findByTaskIdOrderByPositionAscIdAsc(taskId).stream()
        .collect(Collectors.toMap(Subtask::getId, Function.identity()));
    if (orderedIds.size() != byId.size() || !byId.keySet().equals(new HashSet<>(orderedIds))) {
      throw FieldValidationException.of("ids", "must list every subtask of the task exactly once");
    }
    for (int i = 0; i < orderedIds.size(); i++) byId.get(orderedIds.get(i)).setPosition(i);
    return orderedIds.stream().map(byId::get).toList();
  }
}
