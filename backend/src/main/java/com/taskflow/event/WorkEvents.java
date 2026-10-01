package com.taskflow.event;

/** Events about the work INSIDE a task: comments, the checklist, tracked time. Same publishing model as TaskEvents. */
public final class WorkEvents {

  private WorkEvents() {}

  public record CommentAdded(TaskRef task, long actorId, long commentId) {}

  public record SubtaskCompleted(TaskRef task, long actorId, String subtaskTitle) {}

  public record TimeLogged(TaskRef task, long actorId, long minutes) {}
}
