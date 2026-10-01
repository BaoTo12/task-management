package com.taskflow.controller.api;

import com.taskflow.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Every /api/… path and method no other controller claims → a JSON 404, not Spring's default (an HTML page or a
 * different JSON shape). "/api/**" is the LEAST specific pattern, so any real mapping wins over it; a known path with
 * an unsupported method (DELETE /api/stats) also ends here.
 */
@RestController
public class ApiFallbackController {

  @RequestMapping("/api/**")
  void noEndpoint(HttpServletRequest request) {
    throw ApiException.noEndpoint(request);
  }
}
