package com.taskflow.exception.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskflow.dto.response.ApiError;
import com.taskflow.exception.ApiException;
import com.taskflow.web.support.ApiRequests;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

/**
 * Builds the error JSON, for the two places that produce it: ApiExceptionHandler (inside Spring MVC) and the security
 * handlers (BEFORE Spring MVC: a 401 or a CSRF 403 never reaches a controller). The SAME ObjectMapper Spring MVC uses.
 */
@Component
@RequiredArgsConstructor
public class ApiErrorWriter {

  private final ObjectMapper mapper;

  public ApiError body(HttpServletRequest request, ApiException e) {
    return new ApiError(e.status(), e.code(), e.getMessage(), e.fieldErrors(), ApiRequests.path(request),
        Instant.now().toString());
  }

  /** For filters and security handlers: writes the response directly. */
  public void write(HttpServletRequest request, HttpServletResponse response, ApiException e) throws IOException {
    response.setStatus(e.status());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding("UTF-8");
    mapper.writeValue(response.getWriter(), body(request, e));
  }
}
