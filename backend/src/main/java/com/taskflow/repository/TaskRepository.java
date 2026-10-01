package com.taskflow.repository;

import com.taskflow.entity.Task;
import com.taskflow.repository.criteria.TaskSort;
import com.taskflow.repository.criteria.TaskSpecifications;
import com.taskflow.repository.projection.IdCount;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * PROVIDED: tasks. JpaSpecificationExecutor adds findAll(Specification, Pageable) and count(Specification): the task
 * list's WHERE clause is assembled from small Specifications (TaskSpecifications) instead of string concatenation, and
 * every value is a bound parameter. Sorting comes from a Sort object built by the TaskSort allow-list.
 */
public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

  /** Task count per category id (categories without tasks are absent). */
  @Query("select t.categoryId as id, count(t) as count from Task t where t.categoryId is not null group by t.categoryId")
  List<IdCount> countByCategory();

  /** A member leaves a project: their tasks in it become unassigned. */
  @Modifying
  @Query("update Task t set t.assigneeId = null where t.projectId = :projectId and t.assigneeId = :userId")
  int unassignInProject(@Param("projectId") long projectId, @Param("userId") long userId);
}
