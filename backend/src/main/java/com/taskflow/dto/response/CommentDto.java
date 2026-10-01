package com.taskflow.dto.response;

import com.taskflow.entity.Comment;
import java.time.Instant;

public record CommentDto(long id, long taskId, long authorId, String body, Instant createdAt) {

  public static CommentDto from(Comment c) {
    return new CommentDto(c.getId(), c.getTaskId(), c.getAuthorId(), c.getBody(), c.getCreatedAt());
  }
}
