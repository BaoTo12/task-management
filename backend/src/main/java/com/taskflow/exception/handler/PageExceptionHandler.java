package com.taskflow.exception.handler;

import com.taskflow.exception.ForbiddenException;
import com.taskflow.security.AuthUser;
import com.taskflow.security.CurrentUser;
import com.taskflow.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

/**
 * Exceptions from the JSP controllers that need more than a status. (NotFoundException and BadRequestException carry
 * @ResponseStatus: Spring calls sendError(404/400) itself, and Spring Boot's error dispatch renders error/404.jsp.)
 * A ForbiddenException ("someone else's task") is AUDITED, then answered with the 403 page.
 * Lowest precedence: for @RestControllers, ApiExceptionHandler answers first, in JSON.
 */
@ControllerAdvice
@Order(Ordered.LOWEST_PRECEDENCE)
@RequiredArgsConstructor
public class PageExceptionHandler {

  private final AuditService audit;

  @ExceptionHandler(ForbiddenException.class)
  void forbidden(ForbiddenException e, HttpServletRequest request, HttpServletResponse response) throws IOException {
    AuthUser user = CurrentUser.orNull();
    audit.record("ACCESS_DENIED", user == null ? null : user.getUsername(), request.getRemoteAddr(), e.getMessage());
    response.sendError(HttpServletResponse.SC_FORBIDDEN);          // → error/403.jsp
  }
}
