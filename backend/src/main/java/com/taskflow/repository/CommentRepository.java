package com.taskflow.repository;

import com.taskflow.dto.view.CommentDetails;
import com.taskflow.entity.Comment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** PROVIDED: comments. */
public interface CommentRepository extends JpaRepository<Comment, Long> {

  /**
   * Each comment WITH its author, in ONE query: a JPQL constructor expression ("select new …") builds CommentDetails
   * directly. Loading the comments and then each author separately would be the classic N+1 problem.
   */
  @Query("select new com.taskflow.dto.view.CommentDetails(c, u) from Comment c, User u"
      + " where u.id = c.authorId and c.taskId = :taskId order by c.createdAt, c.id")
  List<CommentDetails> findDetailsByTask(@Param("taskId") long taskId);

  List<Comment> findByTaskIdOrderByCreatedAtAscIdAsc(long taskId);
}
