package com.taskflow.service;

import static com.taskflow.repository.criteria.TaskSpecifications.hasPriority;
import static com.taskflow.repository.criteria.TaskSpecifications.hasStatus;
import static com.taskflow.repository.criteria.TaskSpecifications.matching;
import static com.taskflow.repository.criteria.TaskSpecifications.openAndDue;

import com.taskflow.dto.view.PageView;
import com.taskflow.dto.view.TaskDetails;
import com.taskflow.entity.Category;
import com.taskflow.entity.Priority;
import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectRole;
import com.taskflow.entity.Task;
import com.taskflow.entity.TaskStatus;
import com.taskflow.event.TaskEvents;
import com.taskflow.event.TaskRef;
import com.taskflow.exception.DuplicateException;
import com.taskflow.exception.FieldValidationException;
import com.taskflow.exception.ForbiddenException;
import com.taskflow.exception.NotFoundException;
import com.taskflow.repository.CommentRepository;
import com.taskflow.repository.LabelRepository;
import com.taskflow.repository.ProjectMemberRepository;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.repository.SubtaskRepository;
import com.taskflow.repository.TaskRepository;
import com.taskflow.repository.TimeEntryRepository;
import com.taskflow.repository.UserRepository;
import com.taskflow.repository.criteria.TaskQuery;
import com.taskflow.security.AuthUser;
import java.time.Clock;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Consumer;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The task use cases. Controllers (JSP and REST alike) call THIS, never a repository: same rules for both clients.
 * It knows nothing about HTTP: no request, no response, no view.
 *
 * Every use case takes the CALLER. The access rules live in TaskAccess; this class applies them in two ways:
 *   one task:   load it, then canView / canEdit / canDelete, else ForbiddenException
 *   lists:      the "visible" Specification is ANDed into every query, so no list can contain someone else's task
 *
 * Transactions: @Transactional(readOnly = true) on the class is the default for every method (a read-only transaction:
 * Hibernate skips dirty checking); the methods that write override it with @Transactional. The proxy Spring puts
 * around this bean opens the transaction before the method and commits (or rolls back on a RuntimeException) after.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class TaskService {

  /** Tasks per page in the JSP list. */
  public static final int PAGE_SIZE = 10;

  private final TaskRepository tasks;
  private final TaskAccess access;
  private final CategoryService categories;
  private final UserRepository users;
  private final ProjectRepository projects;
  private final ProjectMemberRepository members;
  private final CommentRepository comments;
  private final SubtaskRepository subtasks;
  private final LabelRepository labels;
  private final TimeEntryRepository timeEntries;
  private final ApplicationEventPublisher events;
  private final Clock clock;

  /** "Today" for overdue checks: one clock for the whole application. */
  public LocalDate today() {
    return LocalDate.now(clock);
  }

  // ── Lists ─────────────────────────────────────────────────────────────────────────────────────────────────

  public List<Task> find(TaskQuery query, AuthUser caller) {
    return tasks.findAll(scoped(query, caller), query.sort().toSort(query.descending()));
  }

  /** The API's paging: page is 0-based and NOT clamped (past the end there are simply no items). */
  public Page<Task> pageAt(TaskQuery query, int page, int size, AuthUser caller) {
    return tasks.findAll(scoped(query, caller), PageRequest.of(page, size, query.sort().toSort(query.descending())));
  }

  /** The JSP list's paging: 1-based, and a page number out of range becomes the nearest valid one. */
  public PageView<Task> page(TaskQuery query, int requestedPage, AuthUser caller) {
    Specification<Task> spec = scoped(query, caller);
    int number = PageView.clamp(requestedPage, tasks.count(spec), PAGE_SIZE);
    return PageView.of(tasks.findAll(spec, PageRequest.of(number - 1, PAGE_SIZE, query.sort().toSort(query.descending()))));
  }

  /** Not done and due before today (the dashboard). */
  public List<Task> overdue(AuthUser caller) {
    return tasks.findAll(access.visible(caller).and(openAndDue(null, today().minusDays(1))), Sort.by("dueDate", "id"));
  }

  /** Not done and due between today and today + days (the dashboard). */
  public List<Task> dueWithin(int days, AuthUser caller) {
    return tasks.findAll(access.visible(caller).and(openAndDue(today(), today().plusDays(days))), Sort.by("dueDate", "id"));
  }

  /** Counts per status, keyed by the status NAME, every status present (the JSP reads ${stats['DONE']}). */
  public Map<String, Long> countByStatus(AuthUser caller) {
    Map<String, Long> counts = new LinkedHashMap<>();
    for (TaskStatus status : TaskStatus.values()) {
      counts.put(status.name(), tasks.count(access.visible(caller).and(hasStatus(status))));
    }
    return counts;
  }

  public Map<String, Long> countByPriority(AuthUser caller) {
    Map<String, Long> counts = new LinkedHashMap<>();
    for (Priority priority : Priority.values()) {
      counts.put(priority.name(), tasks.count(access.visible(caller).and(hasPriority(priority))));
    }
    return counts;
  }

  public Optional<Long> latestId(AuthUser caller) {
    return tasks.findAll(access.visible(caller), PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "id")))
        .stream().findFirst().map(Task::getId);
  }

  public List<Category> categories() {
    return categories.list();
  }

  public Set<Long> categoryIds() {
    return categories.ids();
  }

  // ── One task ──────────────────────────────────────────────────────────────────────────────────────────────

  /** Empty if there's no such task; ForbiddenException if it exists but the caller may not see it. */
  public Optional<Task> task(long id, AuthUser caller) {
    Optional<Task> task = tasks.findById(id);
    if (task.isPresent() && !access.canView(task.get(), caller)) throw new ForbiddenException("view task " + id);
    return task;
  }

  /** For the other task-related services (comments, subtasks, time): the task, or an exception. */
  public Task requireVisible(long id, AuthUser caller) {
    return task(id, caller).orElseThrow(() -> new NotFoundException("Task not found"));
  }

  public Task requireEditable(long id, AuthUser caller) {
    Task task = requireVisible(id, caller);
    if (!access.canEdit(task, caller)) throw ForbiddenException.insufficientRole("edit task " + id);
    return task;
  }

  /** The details page's view model, or empty if there's no such task. */
  public Optional<TaskDetails> details(long id, AuthUser caller) {
    return task(id, caller).map(task -> TaskDetails.builder()
        .task(task)
        .category(categories.byId(task.getCategoryId()).orElse(null))
        .project(task.getProjectId() == null ? null : projects.findById(task.getProjectId()).orElse(null))
        .owner(users.findById(task.getOwnerId()).orElse(null))
        .assignee(task.getAssigneeId() == null ? null : users.findById(task.getAssigneeId()).orElse(null))
        .comments(comments.findDetailsByTask(id))
        .subtasks(subtasks.findByTaskIdOrderByPositionAscIdAsc(id))
        .labels(labels.findAllById(task.getLabelIds()))
        .trackedMinutes(timeEntries.findByTaskIdOrderByStartedAtDesc(id).stream()
            .mapToLong(entry -> entry.minutes(clock.instant())).sum())
        .canEdit(access.canEdit(task, caller))
        .canDelete(access.canDelete(task, caller))
        .build());
  }

  // ── Changes ───────────────────────────────────────────────────────────────────────────────────────────────

  /** The owner is the caller, always: never taken from the request (mass assignment). DuplicateException: title taken. */
  @Transactional
  public Task create(Task task, AuthUser caller) {
    task.setOwnerId(caller.getId());
    checkPlacement(task, caller);
    task.syncCompletion(clock.instant());
    Task saved = save(task);
    TaskRef ref = TaskRef.of(saved);
    events.publishEvent(new TaskEvents.Created(ref, caller.getId()));
    if (saved.getAssigneeId() != null) events.publishEvent(new TaskEvents.Assigned(ref, caller.getId(), null));
    return saved;
  }

  /**
   * Applies `changes` to the STORED task inside one transaction. Empty if the task doesn't exist.
   * The callback gets the managed entity: the JSP form's applyTo, the API's TaskInput.applyTo, or a one-liner (toggle).
   * The owner can't change (the column is updatable = false, and nothing exposes a setter path to it from a request).
   */
  @Transactional
  public Optional<Task> update(long id, AuthUser caller, Consumer<Task> changes) {
    Optional<Task> found = tasks.findById(id);
    if (found.isEmpty()) return Optional.empty();
    Task task = found.get();
    if (!access.canView(task, caller)) throw new ForbiddenException("view task " + id);
    if (!access.canEdit(task, caller)) throw ForbiddenException.insufficientRole("edit task " + id);

    TaskStatus statusBefore = task.getStatus();
    Long assigneeBefore = task.getAssigneeId();
    Long projectBefore = task.getProjectId();
    changes.accept(task);
    if (!Objects.equals(projectBefore, task.getProjectId()) || !Objects.equals(assigneeBefore, task.getAssigneeId())) {
      checkPlacement(task, caller);
    }
    task.syncCompletion(clock.instant());
    Task saved = save(task);

    TaskRef ref = TaskRef.of(saved);
    events.publishEvent(new TaskEvents.Updated(ref, caller.getId()));
    if (statusBefore != saved.getStatus()) {
      events.publishEvent(new TaskEvents.StatusChanged(ref, caller.getId(), statusBefore, saved.getStatus()));
    }
    if (!Objects.equals(assigneeBefore, saved.getAssigneeId()) && saved.getAssigneeId() != null) {
      events.publishEvent(new TaskEvents.Assigned(ref, caller.getId(), assigneeBefore));
    }
    return Optional.of(saved);
  }

  /** DONE ↔ TODO. Empty if there's no such task. */
  @Transactional
  public Optional<Task> toggle(long id, AuthUser caller) {
    return update(id, caller, task -> task.setStatus(task.isDone() ? TaskStatus.TODO : TaskStatus.DONE));
  }

  /** Replaces the task's labels. Every id must be an existing label. */
  @Transactional
  public Optional<Task> setLabels(long id, AuthUser caller, Set<Long> labelIds) {
    if (labels.findAllById(labelIds).size() != labelIds.size()) throw FieldValidationException.of("labelIds", "unknown label");
    return update(id, caller, task -> task.replaceLabels(labelIds));
  }

  @Transactional
  public boolean delete(long id, AuthUser caller) {
    Optional<Task> found = tasks.findById(id);
    if (found.isEmpty()) return false;
    Task task = found.get();
    if (!access.canView(task, caller)) throw new ForbiddenException("view task " + id);
    if (!access.canDelete(task, caller)) throw ForbiddenException.insufficientRole("delete task " + id);
    TaskRef ref = TaskRef.of(task);
    tasks.delete(task);                            // comments, subtasks, labels, time: ON DELETE CASCADE
    events.publishEvent(new TaskEvents.Deleted(ref, caller.getId()));
    return true;
  }

  // ── Rules ─────────────────────────────────────────────────────────────────────────────────────────────────

  private Specification<Task> scoped(TaskQuery query, AuthUser caller) {
    return access.visible(caller).and(matching(query));
  }

  /** saveAndFlush: the INSERT/UPDATE runs NOW, so a UNIQUE violation surfaces here, not at commit. */
  private Task save(Task task) {
    try {
      return tasks.saveAndFlush(task);
    } catch (DataIntegrityViolationException e) {
      throw new DuplicateException("title", "you already have a task with this title");
    }
  }

  /**
   * Where a task may live and who may do it:
   *   projectId   a project the caller may add tasks to (MEMBER or more), not archived
   *   assigneeId  in a project: a member who can edit (MEMBER or more); outside a project: only the owner
   */
  private void checkPlacement(Task task, AuthUser caller) {
    Map<String, String> errors = new LinkedHashMap<>();
    Long projectId = task.getProjectId();
    if (projectId != null) {
      Optional<Project> project = projects.findById(projectId);
      boolean member = caller.isAdmin()
          || members.findRole(projectId, caller.getId()).filter(r -> r.atLeast(ProjectRole.MEMBER)).isPresent();
      if (project.isEmpty() || !member) errors.put("projectId", "unknown project, or you can't add tasks to it");
      else if (project.get().isArchived()) errors.put("projectId", "the project is archived");
    }
    Long assigneeId = task.getAssigneeId();
    if (assigneeId != null) {
      if (projectId == null) {
        if (assigneeId != task.getOwnerId()) errors.put("assigneeId", "a task outside a project can only be assigned to its owner");
      } else if (members.findRole(projectId, assigneeId).filter(r -> r.atLeast(ProjectRole.MEMBER)).isEmpty()) {
        errors.put("assigneeId", "must be a member of the task's project");
      }
    }
    if (!errors.isEmpty()) throw new FieldValidationException(errors);
  }
}
