package com.taskflow.exception;

/**
 * A UNIQUE constraint said no (a task title the owner already uses, a taken category name). Services catch Spring's
 * DataIntegrityViolationException at saveAndFlush() and rethrow this, naming the FIELD, so a form or the API can
 * show it as that field's error.
 */
public class DuplicateException extends RuntimeException {

  private final String field;

  public DuplicateException(String field, String message) {
    super(message);
    this.field = field;
  }

  public String field() {
    return field;
  }
}
