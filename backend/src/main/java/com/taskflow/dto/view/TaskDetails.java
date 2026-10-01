package com.taskflow.dto.view;

import com.taskflow.entity.Category;
import com.taskflow.entity.Label;
import com.taskflow.entity.Project;
import com.taskflow.entity.Subtask;
import com.taskflow.entity.Task;
import com.taskflow.entity.User;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

/**
 * Everything the task details PAGE shows, as ONE object for the view (a "view model"):
 *   ${details.task.title} · ${details.category.name} · ${details.owner.displayName} · ${details.assignee.displayName}
 *   ${details.project.name} · ${details.comments} · ${details.subtasks} · ${details.labels} · ${details.trackedMinutes}
 * category, project, assignee may be null: EL walks a null chain without an exception and prints nothing; the view
 * decides what to show instead with `empty`. canEdit/canDelete decide which buttons the page offers (the service
 * checks again on POST).
 * @Builder: eleven values; named builder calls are far easier to read than an eleven-argument constructor.
 */
@Getter
@Builder
public class TaskDetails {

  private final Task task;
  private final Category category;
  private final Project project;
  private final User owner;
  private final User assignee;
  private final List<CommentDetails> comments;
  private final List<Subtask> subtasks;
  private final List<Label> labels;
  private final long trackedMinutes;
  private final boolean canEdit;
  private final boolean canDelete;

  /** "3/5" for the checklist header. */
  public long getSubtasksDone() {
    return subtasks.stream().filter(Subtask::isDone).count();
  }
}
