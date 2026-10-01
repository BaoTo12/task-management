package com.taskflow.exception.handler;

import com.taskflow.dto.response.ApiError;
import com.taskflow.exception.ApiException;
import com.taskflow.exception.BadRequestException;
import com.taskflow.exception.DuplicateException;
import com.taskflow.exception.FieldValidationException;
import com.taskflow.exception.ForbiddenException;
import com.taskflow.exception.NotFoundException;
import com.taskflow.security.AuthUser;
import com.taskflow.security.CurrentUser;
import com.taskflow.service.AuditService;
import com.taskflow.web.support.ApiRequests;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

/**
 * EVERY exception thrown by a @RestController becomes the standard error JSON here: one place, one format (the servlet
 * era's ApiExceptionFilter). annotations = RestController.class: this advice only applies to API controllers, so the
 * JSP controllers keep their HTML error pages. @Order: consulted before any other advice.
 */
@RestControllerAdvice(annotations = RestController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class ApiExceptionHandler {

  private final ApiErrorWriter errors;
  private final AuditService audit;

  @ExceptionHandler(ApiException.class)
  ResponseEntity<ApiError> api(ApiException e, HttpServletRequest request) {
    return respond(request, e);
  }

  @ExceptionHandler(NotFoundException.class)
  ResponseEntity<ApiError> notFound(NotFoundException e, HttpServletRequest request) {
    return respond(request, ApiException.notFound(e.getMessage()));
  }

  /** Audited; someone else's task is answered EXACTLY like a missing one (the API never confirms it exists). */
  @ExceptionHandler(ForbiddenException.class)
  ResponseEntity<ApiError> forbidden(ForbiddenException e, HttpServletRequest request) {
    AuthUser user = CurrentUser.orNull();
    audit.record("ACCESS_DENIED", user == null ? null : user.getUsername(), request.getRemoteAddr(), e.getMessage());
    return respond(request, e.isHidesExistence() ? ApiException.notFound("Not found") : ApiException.forbidden());
  }

  /** A ROLE problem (@PreAuthorize): that the endpoint exists is no secret, so 403. */
  @ExceptionHandler(AccessDeniedException.class)
  ResponseEntity<ApiError> accessDenied(AccessDeniedException e, HttpServletRequest request) {
    return respond(request, ApiException.forbidden());
  }

  @ExceptionHandler(FieldValidationException.class)
  ResponseEntity<ApiError> fieldValidation(FieldValidationException e, HttpServletRequest request) {
    return respond(request, ApiException.validation(e.fieldErrors()));
  }

  @ExceptionHandler(DuplicateException.class)
  ResponseEntity<ApiError> duplicate(DuplicateException e, HttpServletRequest request) {
    return respond(request, ApiException.validation(Map.of(e.field(), e.getMessage())));
  }

  @ExceptionHandler(BadRequestException.class)
  ResponseEntity<ApiError> badRequest(BadRequestException e, HttpServletRequest request) {
    return respond(request, ApiException.badRequest(e.getMessage()));
  }

  /** @Valid on a @RequestBody failed: every field's first message, in field order. */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ApiError> invalidBody(MethodArgumentNotValidException e, HttpServletRequest request) {
    Map<String, String> fields = new LinkedHashMap<>();
    for (FieldError error : e.getBindingResult().getFieldErrors()) {
      fields.putIfAbsent(error.getField(), error.getDefaultMessage());
    }
    return respond(request, ApiException.validation(fields));
  }

  /** Constraints on @RequestParam / @PathVariable (e.g. @Min(1) on ?size=). */
  @ExceptionHandler(HandlerMethodValidationException.class)
  ResponseEntity<ApiError> invalidParameters(HandlerMethodValidationException e, HttpServletRequest request) {
    Map<String, String> fields = new LinkedHashMap<>();
    e.getParameterValidationResults().forEach(result -> fields.putIfAbsent(
        result.getMethodParameter().getParameterName(), result.getResolvableErrors().get(0).getDefaultMessage()));
    return respond(request, ApiException.validation(fields));
  }

  /** "/api/tasks/abc" is a missing task (404); "?page=abc" is a bad parameter (400). */
  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  ResponseEntity<ApiError> typeMismatch(MethodArgumentTypeMismatchException e, HttpServletRequest request) {
    if (e.getParameter().hasParameterAnnotation(PathVariable.class)) return respond(request, ApiException.notFound("Not found"));
    return respond(request, ApiException.validation(Map.of(e.getName(), "has an invalid value")));
  }

  @ExceptionHandler(MissingServletRequestParameterException.class)
  ResponseEntity<ApiError> missingParameter(MissingServletRequestParameterException e, HttpServletRequest request) {
    return respond(request, ApiException.validation(Map.of(e.getParameterName(), "is required")));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  ResponseEntity<ApiError> unreadable(HttpMessageNotReadableException e, HttpServletRequest request) {
    return respond(request, new ApiException(400, "MALFORMED_JSON", "Request body is not valid JSON", null));
  }

  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  ResponseEntity<ApiError> mediaType(HttpMediaTypeNotSupportedException e, HttpServletRequest request) {
    return respond(request, new ApiException(415, "UNSUPPORTED_MEDIA_TYPE", "Send the request body as application/json", null));
  }

  @ExceptionHandler(ResponseStatusException.class)
  ResponseEntity<ApiError> status(ResponseStatusException e, HttpServletRequest request) {
    int status = e.getStatusCode().value();
    return respond(request, new ApiException(status, "HTTP_" + status, e.getReason() == null ? "Error" : e.getReason(), null));
  }

  /** Anything else is OUR bug: logged with the stack trace (and the request id), answered without any detail. */
  @ExceptionHandler(Exception.class)
  ResponseEntity<ApiError> unexpected(Exception e, HttpServletRequest request) {
    log.error("Unhandled API error on {} {}", request.getMethod(), ApiRequests.path(request), e);
    return respond(request, new ApiException(500, "INTERNAL_ERROR", "Something went wrong on our side", null));
  }

  private ResponseEntity<ApiError> respond(HttpServletRequest request, ApiException e) {
    return ResponseEntity.status(e.status()).body(errors.body(request, e));
  }
}
