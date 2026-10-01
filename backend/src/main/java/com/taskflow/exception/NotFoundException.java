package com.taskflow.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * "There is no such thing" (or: there is, but the caller may not know it exists). Thrown by services and controllers.
 *   pages: @ResponseStatus → sendError(404) → Spring Boot's error dispatch → WEB-INF/views/error/404.jsp
 *   API:   ApiExceptionHandler → 404 NOT_FOUND error JSON
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class NotFoundException extends RuntimeException {

  public NotFoundException() {
    super("Not found");
  }

  public NotFoundException(String message) {
    super(message);
  }
}
