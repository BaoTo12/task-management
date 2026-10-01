package com.taskflow.exception;

import java.util.Map;

/**
 * Business-rule validation that needs the database ("the assignee must be a member of the project"): the shape of the
 * input was fine, the SERVICE found the problem. field → message, like a form's errors.
 */
public class FieldValidationException extends RuntimeException {

  private final Map<String, String> fieldErrors;

  public FieldValidationException(Map<String, String> fieldErrors) {
    super("Request contains invalid fields");
    this.fieldErrors = Map.copyOf(fieldErrors);
  }

  public static FieldValidationException of(String field, String message) {
    return new FieldValidationException(Map.of(field, message));
  }

  public Map<String, String> fieldErrors() {
    return fieldErrors;
  }
}
