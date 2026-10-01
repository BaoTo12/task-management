package com.taskflow.controller.api;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.taskflow.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

/** The SPA's authentication contract: /api/auth/csrf, login, me, and the CSRF double-submit rule. */
class AuthApiControllerTest extends IntegrationTest {

  @Test
  void csrfEndpointIssuesAReadableXsrfCookie() throws Exception {
    mvc.perform(get("/api/auth/csrf"))
        .andExpect(status().isNoContent())
        .andExpect(cookie().exists("XSRF-TOKEN"))
        .andExpect(cookie().httpOnly("XSRF-TOKEN", false));            // JavaScript must be able to read it
  }

  @Test
  void loginWithTheRightPasswordReturnsTheProfile() throws Exception {
    mvc.perform(post("/api/auth/login").with(csrf().asHeader())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"bob\",\"password\":\"bob123\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("bob"))
        .andExpect(jsonPath("$.passwordHash").doesNotExist());       // a DTO, never the entity
  }

  @Test
  void aWrongPasswordAndAnUnknownUserGetTheSameAnswer() throws Exception {
    for (String body : new String[] {"{\"username\":\"bob\",\"password\":\"nope\"}", "{\"username\":\"nobody\",\"password\":\"x\"}"}) {
      mvc.perform(post("/api/auth/login").with(csrf().asHeader()).contentType(MediaType.APPLICATION_JSON).content(body))
          .andExpect(status().isUnauthorized())
          .andExpect(jsonPath("$.error").value("BAD_CREDENTIALS"));
    }
  }

  @Test
  void loginWithoutTheCsrfHeaderIsRefused() throws Exception {
    mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"bob\",\"password\":\"bob123\"}"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error").value("CSRF_TOKEN_INVALID"));
  }

  @Test
  void meAnswersAnonymousCallersWithJson401() throws Exception {
    mvc.perform(get("/api/auth/me"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
  }

  @Test
  void meReturnsTheLoggedInUser() throws Exception {
    mvc.perform(get("/api/auth/me").with(as(ALICE)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.displayName").value("Alice Nguyen"));
  }

  @Test
  void anUnknownApiPathIsAJson404() throws Exception {
    mvc.perform(get("/api/nope").with(as(ALICE)))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error").value("NOT_FOUND"))
        .andExpect(jsonPath("$.path").value("/api/nope"));
  }
}
