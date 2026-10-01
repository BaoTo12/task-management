package com.taskflow.service;

import com.taskflow.dto.view.CommentDetails;
import com.taskflow.entity.Comment;
import com.taskflow.entity.Task;
import com.taskflow.event.TaskRef;
import com.taskflow.event.WorkEvents;
import com.taskflow.repository.CommentRepository;
import com.taskflow.security.AuthUser;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Comments on a task. Anyone who can SEE a task may comment on it (project viewers included: a comment is how a viewer
 * asks a question). The body is stored as typed; escaping is the renderer's job.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CommentService {

  private final TaskService tasks;
  private final CommentRepository comments;
  private final ApplicationEventPublisher events;

  /** A task's comments with their authors, oldest first. NotFoundException / ForbiddenException for the task. */
  public List<CommentDetails> forTask(long taskId, AuthUser caller) {
    tasks.requireVisible(taskId, caller);
    return comments.findDetailsByTask(taskId);
  }

  /** The body must already be validated (1 to 1000 characters, trimmed). The author is the caller. */
  @Transactional
  public Comment add(long taskId, AuthUser caller, String body) {
    Task task = tasks.requireVisible(taskId, caller);
    Comment saved = comments.save(new Comment(taskId, caller.getId(), body));
    events.publishEvent(new WorkEvents.CommentAdded(TaskRef.of(task), caller.getId(), saved.getId()));
    return saved;
  }
}
