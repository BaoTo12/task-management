package com.taskflow.repository.criteria;

import com.taskflow.entity.Priority;
import com.taskflow.entity.ProjectMember;
import com.taskflow.entity.Task;
import com.taskflow.entity.TaskStatus;
import com.taskflow.security.AuthUser;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.data.jpa.domain.Specification;

/**
 * PROVIDED: the task list's WHERE clause as composable Specifications (JPA Criteria API underneath). Each method returns
 * one condition; the service combines them with .and(…). Values are always bound parameters: a search for
 * "x' OR 1=1 --" is just text. In LIKE, % and _ are wildcards, so they're escaped with '!' (a search for "100%" must
 * match the text "100%", not everything).
 */
public final class TaskSpecifications {

  private static final char ESCAPE = '!';

  private TaskSpecifications() {}

  /** WHO may see a task: its owner, its assignee, any member of its project; an admin sees everything. */
  public static Specification<Task> visibleTo(AuthUser caller) {
    if (caller.isAdmin()) return (root, query, cb) -> cb.conjunction();
    return (root, query, cb) -> {
      Subquery<Long> myProjects = query.subquery(Long.class);
      Root<ProjectMember> member = myProjects.from(ProjectMember.class);
      myProjects.select(member.get("id").get("projectId"))
          .where(cb.equal(member.get("id").get("userId"), caller.getId()));
      return cb.or(
          cb.equal(root.get("ownerId"), caller.getId()),
          cb.equal(root.get("assigneeId"), caller.getId()),
          root.get("projectId").in(myProjects));
    };
  }

  /** WHAT the request filters by: every non-null field of the query. */
  public static Specification<Task> matching(TaskQuery q) {
    return (root, query, cb) -> {
      List<Predicate> where = new ArrayList<>();
      if (q.status() != null) where.add(cb.equal(root.get("status"), q.status()));
      if (q.priority() != null) where.add(cb.equal(root.get("priority"), q.priority()));
      if (q.categoryId() != null) where.add(cb.equal(root.get("categoryId"), q.categoryId()));
      if (q.projectId() != null) where.add(cb.equal(root.get("projectId"), q.projectId()));
      if (q.assigneeId() != null) where.add(cb.equal(root.get("assigneeId"), q.assigneeId()));
      if (q.labelId() != null) where.add(cb.isMember(q.labelId(), root.<Set<Long>>get("labelIds")));
      if (q.text() != null) {
        String pattern = "%" + escapeLike(q.text().toLowerCase(Locale.ROOT)) + "%";
        where.add(cb.or(
            cb.like(cb.lower(root.get("title")), pattern, ESCAPE),
            cb.like(cb.lower(root.get("description")), pattern, ESCAPE)));
      }
      return cb.and(where.toArray(Predicate[]::new));
    };
  }

  public static Specification<Task> hasStatus(TaskStatus status) {
    return (root, query, cb) -> cb.equal(root.get("status"), status);
  }

  public static Specification<Task> hasPriority(Priority priority) {
    return (root, query, cb) -> cb.equal(root.get("priority"), priority);
  }

  public static Specification<Task> inProject(Long projectId) {
    return (root, query, cb) -> projectId == null ? cb.conjunction() : cb.equal(root.get("projectId"), projectId);
  }

  /** Not done, with a due date in [from, to] (either end may be null: open). */
  public static Specification<Task> openAndDue(LocalDate from, LocalDate to) {
    return (root, query, cb) -> {
      List<Predicate> where = new ArrayList<>();
      where.add(cb.notEqual(root.get("status"), TaskStatus.DONE));
      where.add(cb.isNotNull(root.get("dueDate")));
      if (from != null) where.add(cb.greaterThanOrEqualTo(root.get("dueDate"), from));
      if (to != null) where.add(cb.lessThanOrEqualTo(root.get("dueDate"), to));
      return cb.and(where.toArray(Predicate[]::new));
    };
  }

  static String escapeLike(String text) {
    return text.replace("!", "!!").replace("%", "!%").replace("_", "!_");
  }
}
