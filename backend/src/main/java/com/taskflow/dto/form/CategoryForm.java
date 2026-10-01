package com.taskflow.dto.form;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

/**
 * The category form, bound by Spring MVC's DATA BINDING: request parameters "name" and "color" → setters, then
 * @Valid runs these Bean Validation constraints and puts every failure in a BindingResult (field → message).
 * The messages are keys of the i18n bundle ({…}): the same bundle the JSPs use.
 * The form object is also what the page shows again after an error: ${newForm.name} keeps what the user typed.
 */
@Getter
public class CategoryForm {

  public static final int NAME_MAX = 50;                          // = categories.name

  @NotBlank(message = "{validation.category.name.blank}")
  @Size(max = NAME_MAX, message = "{validation.category.name.size}")
  private String name = "";

  @Pattern(regexp = "#[0-9a-fA-F]{6}", message = "{validation.category.color}")
  private String color = "#64748b";

  /** Custom setters (Lombok writes only the getters): every value arrives trimmed. */
  public void setName(String name) { this.name = name == null ? "" : name.strip(); }

  public void setColor(String color) { this.color = color == null ? "" : color.strip(); }
}
