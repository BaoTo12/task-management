package com.taskflow.controller.web;

import com.taskflow.dto.form.CategoryForm;
import com.taskflow.entity.Category;
import com.taskflow.exception.DuplicateException;
import com.taskflow.exception.NotFoundException;
import com.taskflow.service.CategoryService;
import com.taskflow.web.support.Messages;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * GET  /categories          every category with its task count, a rename form per row, a "new" form
 * POST /categories/save     without id → create; with id → rename/recolour. Invalid → 400 + the page again (the form
 *                           keeps the typed values); valid → flash + 303 (Post/Redirect/Get)
 * POST /categories/delete   a category still used by tasks is NOT deleted: reported with a flash message
 */
@Controller
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryPageController {

  private final CategoryService service;
  private final Messages messages;

  @GetMapping
  String list(Model model) {
    return show(model, new CategoryForm(), Map.of());
  }

  /**
   * @ModelAttribute + @Valid: Spring creates a CategoryForm, binds the parameters, validates; BindingResult (which MUST
   * come right after the validated parameter) receives the errors instead of an exception.
   */
  @PostMapping("/save")
  String save(@RequestParam(required = false) Long id, @Valid @ModelAttribute("newForm") CategoryForm form,
              BindingResult binding, Model model, HttpServletResponse response, RedirectAttributes redirect) {
    Map<String, String> errors = errors(binding);
    if (errors.isEmpty()) {
      try {
        if (id == null) {
          service.create(form.getName(), form.getColor());
          redirect.addFlashAttribute("flash", messages.get("flash.category.created", form.getName()));
        } else {
          if (!service.rename(id, form.getName(), form.getColor())) throw new NotFoundException();
          redirect.addFlashAttribute("flash", messages.get("flash.category.saved"));
        }
        return "redirect:/categories";
      } catch (DuplicateException e) {
        errors.put(e.field(), e.getMessage());
      }
    }
    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
    return show(model, id == null ? form : new CategoryForm(), errors);
  }

  @PostMapping("/delete")
  String delete(@RequestParam long id, RedirectAttributes redirect) {
    Category category = service.byId(id).orElseThrow(NotFoundException::new);
    long used = service.taskCounts().getOrDefault(id, 0L);
    switch (service.delete(id)) {
      case DELETED -> redirect.addFlashAttribute("flash", messages.get("flash.category.deleted", category.getName()));
      case IN_USE -> redirect.addFlashAttribute("flash", messages.get("flash.category.inUse", category.getName(), used));
      case NOT_FOUND -> throw new NotFoundException();
    }
    return "redirect:/categories";
  }

  private String show(Model model, CategoryForm newForm, Map<String, String> errors) {
    model.addAttribute("pageTitle", messages.get("page.categories"));
    model.addAttribute("categories", service.list());
    model.addAttribute("counts", service.taskCounts());            // Map<Long, Long>: ${counts[category.id]}
    model.addAttribute("newForm", newForm);
    model.addAttribute("errors", errors);
    return "categories/list";
  }

  /** field → its first message, in form order: what form-errors.jsp shows. */
  private static Map<String, String> errors(BindingResult binding) {
    Map<String, String> errors = new LinkedHashMap<>();
    for (FieldError error : binding.getFieldErrors()) errors.putIfAbsent(error.getField(), error.getDefaultMessage());
    return errors;
  }
}
