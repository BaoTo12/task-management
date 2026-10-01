package com.taskflow.security.handler;

import com.taskflow.exception.ApiException;
import com.taskflow.exception.handler.ApiErrorWriter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/**
 * What Spring Security does when an ANONYMOUS request needs a login. For the API: 401 + error JSON. Never a redirect
 * to a login page: a fetch() would silently follow it and hand HTML to code that expects JSON.
 */
@Component
@RequiredArgsConstructor
public class JsonAuthenticationEntryPoint implements AuthenticationEntryPoint {

  private final ApiErrorWriter errors;

  @Override
  public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException e)
      throws IOException {
    errors.write(request, response, ApiException.unauthenticated());
  }
}
