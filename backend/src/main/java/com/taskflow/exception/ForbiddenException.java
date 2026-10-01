package com.taskflow.exception;

import lombok.Getter;

/**
 * Thrown by a SERVICE when the caller may not touch what they asked for ("task 23 belongs to someone else").
 * The service decides; the web layer turns it into a response and an ACCESS_DENIED audit event:
 *   pages: PageExceptionHandler → the 403 page
 *   API:   ApiExceptionHandler → 404 when the caller isn't supposed to know the thing exists (hidesExistence),
 *          403 when they can see it but lack the right (a project VIEWER trying to rename the project)
 * The message is for the audit log, never for the user.
 * Not Spring Security's AccessDeniedException on purpose: that one is about roles and URLs, this one about data.
 */
@Getter
public class ForbiddenException extends RuntimeException {

  private final boolean hidesExistence;

  /** Someone else's resource: answered like a missing one. */
  public ForbiddenException(String details) {
    this(details, true);
  }

  private ForbiddenException(String details, boolean hidesExistence) {
    super(details);
    this.hidesExistence = hidesExistence;
  }

  /** A resource the caller CAN see, but not change this way. */
  public static ForbiddenException insufficientRole(String details) {
    return new ForbiddenException(details, false);
  }
}
