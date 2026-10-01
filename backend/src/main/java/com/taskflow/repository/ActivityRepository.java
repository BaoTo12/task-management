package com.taskflow.repository;

import com.taskflow.entity.ActivityEvent;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** PROVIDED: the activity feed. */
public interface ActivityRepository extends JpaRepository<ActivityEvent, Long> {

  /**
   * The feed a user may see, newest first, with a cursor (before = an id). Visible: everything for an admin; otherwise
   * what they did themselves, anything in their projects, and anything about tasks they own or are assigned to.
   * Optional filters by project or task (null = all).
   */
  @Query("""
      select a from ActivityEvent a
      where (:projectId is null or a.projectId = :projectId)
        and (:taskId is null or a.taskId = :taskId)
        and (:before is null or a.id < :before)
        and (:admin = true
             or a.actorId = :userId
             or a.projectId in (select m.id.projectId from ProjectMember m where m.id.userId = :userId)
             or a.taskId in (select t.id from Task t where t.ownerId = :userId or t.assigneeId = :userId))
      order by a.id desc""")
  List<ActivityEvent> feed(@Param("userId") long userId, @Param("admin") boolean admin,
                           @Param("projectId") Long projectId, @Param("taskId") Long taskId,
                           @Param("before") Long before, Pageable limit);
}
