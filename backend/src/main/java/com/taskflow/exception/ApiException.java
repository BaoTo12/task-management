package com.taskflow.exception;

import com.taskflow.exception.handler.ApiExceptionHandler;
import com.taskflow.web.support.ApiRequests;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * An API outcome that isn't a success, thrown from a @RestController and turned into the error JSON by
 * ApiExceptionHandler. The code ("VALIDATION_FAILED") is for programs; the message for people.
 */
public class ApiException extends RuntimeException {

  private final int status;
  private final String code;
  private final Map<String, String> fieldErrors;

  public ApiException(int status, String code, String message, Map<String, String> fieldErrors) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  public int status() { return status; }
  public String code() { return code; }
  public Map<String, String> fieldErrors() { return fieldErrors; }

  public static ApiException validation(Map<String, String> fieldErrors) {
    return new ApiException(400, "VALIDATION_FAILED", "Request contains invalid fields", fieldErrors);
  }

  public static ApiException badRequest(String message) {
    return new ApiException(400, "VALIDATION_FAILED", message, null);
  }

  public static ApiException notFound(String message) {
    return new ApiException(404, "NOT_FOUND", message, null);
  }

  public static ApiException noEndpoint(HttpServletRequest request) {
    return notFound("No endpoint " + request.getMethod() + " " + ApiRequests.path(request));
  }

  public static ApiException unauthenticated() {
    return new ApiException(401, "UNAUTHENTICATED", "Not logged in", null);
  }

  /** The same answer for an unknown user and a wrong password: it doesn't reveal which usernames exist. */
  public static ApiException badCredentials() {
    return new ApiException(401, "BAD_CREDENTIALS", "Invalid username or password", null);
  }

  public static ApiException csrfInvalid() {
    return new ApiException(403, "CSRF_TOKEN_INVALID", "Missing or invalid CSRF token", null);
  }

  public static ApiException forbidden() {
    return new ApiException(403, "FORBIDDEN", "You may not do this", null);
  }

  /** The caller must also set Retry-After. */
  public static ApiException tooManyRequests() {
    return new ApiException(429, "TOO_MANY_REQUESTS", "Too many failed attempts. Please try again later.", null);
  }
}
