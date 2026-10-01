package com.taskflow.dto.form;

import com.taskflow.entity.Priority;
import com.taskflow.entity.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

/**
 * The JSP task form ("form backing object"), bound by Spring MVC from request parameters and rendered with Spring's
 * <form:…> tags (tasks/form.jsp):
 *   - typed fields: "2026-10-03" becomes a LocalDate (@DateTimeFormat), "HIGH" a Priority. A value that can't be
 *     converted becomes a "typeMismatch" field error (its text: messages.properties), and <form:input> shows what the
 *     user typed, not a blank field.
 *   - Bean Validation for the rules (@NotBlank, @Size).
 *   - ONLY these fields: never an id, an owner or a status from the form (mass assignment). The task's id travels in
 *     the URL (?id=), the owner comes from the session.
 * Lombok @Getter/@Setter: a form object IS a JavaBean (binding calls setters, EL calls getters).
 */
@Getter
@Setter
@NoArgsConstructor
public class TaskForm {

  @NotBlank
  @Size(max = 120)
  private String title = "";

  @Size(max = 2000)
  private String description = "";

  @NotNull
  private Priority priority = Priority.MEDIUM;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)     // what <input type="date"> sends
  private LocalDate dueDate;

  private Long categoryId;
  private Long projectId;
  private Long assigneeId;

  /** An edit form, pre-filled from a stored task. */
  public static TaskForm of(Task task) {
    TaskForm form = new TaskForm();
    form.title = task.getTitle();
    form.description = task.getDescription();
    form.priority = task.getPriority();
    form.dueDate = task.getDueDate();
    form.categoryId = task.getCategoryId();
    form.projectId = task.getProjectId();
    form.assigneeId = task.getAssigneeId();
    return form;
  }

  /** Copies the form's fields onto a task (the stored one when editing). Call only when binding found no errors. */
  public void applyTo(Task task) {
    task.setTitle(title.strip());
    task.setDescription(description == null ? "" : description.strip());
    task.setPriority(priority);
    task.setDueDate(dueDate);
    task.setCategoryId(categoryId);
    task.setProjectId(projectId);
    task.setAssigneeId(assigneeId);
  }
}
