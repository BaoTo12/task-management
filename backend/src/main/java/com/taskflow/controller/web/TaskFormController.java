package com.taskflow.controller.web;

import com.taskflow.dto.form.TaskForm;
import com.taskflow.entity.Priority;
import com.taskflow.entity.Task;
import com.taskflow.exception.DuplicateException;
import com.taskflow.exception.FieldValidationException;
import com.taskflow.exception.NotFoundException;
import com.taskflow.security.AuthUser;
import com.taskflow.service.ProjectService;
import com.taskflow.service.TaskService;
import com.taskflow.service.UserService;
import com.taskflow.web.support.Messages;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * ONE form (tasks/form.jsp) for creating and editing a task, the classic Spring MVC way:
 *   GET   → a form object in the model under "form"; the JSP renders it with <form:form modelAttribute="form">
 *   POST  → @Valid @ModelAttribute binds + validates; BindingResult collects the errors
 *           errors → 400 + the SAME view again (the typed values and the messages come back through the form tags)
 *           valid  → save, flash, 303 to the task (Post/Redirect/Get: a reload can't submit twice)
 * Errors found by the SERVICE (duplicate title, assignee not in the project) are added to the same BindingResult
 * with rejectValue(), so the page shows them next to their field like any other.
 */
@Controller
@RequestMapping("/tasks")
@RequiredArgsConstructor
public class TaskFormController {

  private final TaskService tasks;
  private final ProjectService projects;
  private final UserService users;
  private final Messages messages;

  @GetMapping("/new")
  String newForm(@AuthenticationPrincipal AuthUser user, Model model) {
    model.addAttribute("form", new TaskForm());
    return show(model, user, null);
  }

  @PostMapping("/new")
  String create(@Valid @ModelAttribute("form") TaskForm form, BindingResult binding, @AuthenticationPrincipal AuthUser user,
                Model model, HttpServletResponse response, RedirectAttributes redirect) {
    checkCategory(form, binding);
    if (!binding.hasErrors()) {
      try {
        Task task = new Task();
        form.applyTo(task);
        Task saved = tasks.create(task, user);
        redirect.addFlashAttribute("flash", messages.get("flash.task.created"));
        return "redirect:/tasks/view?id=" + saved.getId();
      } catch (DuplicateException | FieldValidationException e) {
        reject(binding, e);
      }
    }
    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
    return show(model, user, null);
  }

  @GetMapping("/edit")
  String editForm(@RequestParam long id, @AuthenticationPrincipal AuthUser user, Model model) {
    Task task = tasks.requireEditable(id, user);
    model.addAttribute("form", TaskForm.of(task));
    return show(model, user, id);
  }

  @PostMapping("/edit")
  String update(@RequestParam long id, @Valid @ModelAttribute("form") TaskForm form, BindingResult binding,
                @AuthenticationPrincipal AuthUser user, Model model, HttpServletResponse response,
                RedirectAttributes redirect) {
    checkCategory(form, binding);
    if (!binding.hasErrors()) {
      try {
        tasks.update(id, user, form::applyTo).orElseThrow(NotFoundException::new);
        redirect.addFlashAttribute("flash", messages.get("flash.task.saved"));
        return "redirect:/tasks/view?id=" + id;
      } catch (DuplicateException | FieldValidationException e) {
        reject(binding, e);
      }
    }
    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
    return show(model, user, id);
  }

  private String show(Model model, AuthUser user, Long taskId) {
    model.addAttribute("taskId", taskId);
    model.addAttribute("formAction", taskId == null ? "/tasks/new" : "/tasks/edit?id=" + taskId);
    model.addAttribute("pageTitle", messages.get(taskId == null ? "page.newTask" : "page.editTask"));
    model.addAttribute("priorities", Priority.values());
    model.addAttribute("categories", tasks.categories());
    model.addAttribute("projects", projects.list(user));
    model.addAttribute("people", users.enabledUsers());
    return "tasks/form";
  }

  private void checkCategory(TaskForm form, BindingResult binding) {
    if (form.getCategoryId() != null && !tasks.categoryIds().contains(form.getCategoryId())) {
      binding.rejectValue("categoryId", "invalid", messages.get("validation.task.category"));
    }
  }

  private static void reject(BindingResult binding, RuntimeException e) {
    if (e instanceof DuplicateException duplicate) {
      binding.rejectValue(duplicate.field(), "duplicate", duplicate.getMessage());
    } else if (e instanceof FieldValidationException invalid) {
      invalid.fieldErrors().forEach((field, message) -> binding.rejectValue(field, "invalid", message));
    }
  }
}
