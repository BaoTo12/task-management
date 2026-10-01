package com.taskflow.dto.view;

import com.taskflow.entity.Comment;
import com.taskflow.entity.User;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * A comment with its author, for the view: ${item.comment.body}, ${item.author.displayName}, ${item.author.admin}.
 * Built by a JPQL CONSTRUCTOR EXPRESSION (CommentRepository.findDetailsByTask): one query, no N+1.
 * A class with getters, not a record: JSP's EL reads JavaBean getters (getComment()), not record accessors (comment()).
 */
@Getter
@RequiredArgsConstructor
public class CommentDetails {

  private final Comment comment;
  private final User author;
}
