package com.taskflow.dto.response;

import com.taskflow.entity.Subtask;

public record SubtaskDto(long id, long taskId, String title, boolean done, int position) {

  public static SubtaskDto from(Subtask s) {
    return new SubtaskDto(s.getId(), s.getTaskId(), s.getTitle(), s.isDone(), s.getPosition());
  }
}
