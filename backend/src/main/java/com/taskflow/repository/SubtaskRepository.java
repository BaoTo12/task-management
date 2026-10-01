package com.taskflow.repository;

import com.taskflow.entity.Subtask;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** PROVIDED: checklist items. */
public interface SubtaskRepository extends JpaRepository<Subtask, Long> {

  List<Subtask> findByTaskIdOrderByPositionAscIdAsc(long taskId);

  /** The next free position at the end of the checklist (0 for an empty one). */
  @Query("select coalesce(max(s.position) + 1, 0) from Subtask s where s.taskId = :taskId")
  int nextPosition(@Param("taskId") long taskId);
}
