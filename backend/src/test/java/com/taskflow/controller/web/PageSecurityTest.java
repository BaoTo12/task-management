package com.taskflow.controller.web;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrlPattern;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import com.taskflow.support.IntegrationTest;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;

/**
 * The Admin Portal's rules. MockMvc doesn't RUN JSPs (there is no JSP engine without a real container): it records the
 * view name and the forwarded URL, which is exactly what a controller test should check.
 */
class PageSecurityTest extends IntegrationTest {

  @Test
  void anonymousVisitorsAreSentToTheLoginPage() throws Exception {
    mvc.perform(get("/tasks"))
        .andExpect(status().is3xxRedirection())
        .andExpect(redirectedUrlPattern("**/login"));
  }

  @Test
  void theTaskListRendersTheListView() throws Exception {
    mvc.perform(get("/tasks").with(as(ALICE)))
        .andExpect(status().isOk())
        .andExpect(view().name("tasks/list"))
        .andExpect(forwardedUrl("/WEB-INF/views/tasks/list.jsp"))
        .andExpect(model().attributeExists("taskPage", "stats", "categories"));
  }

  @Test
  void aUserIsForbiddenOnAdminPages() throws Exception {
    mvc.perform(get("/admin/users").with(as(ALICE))).andExpect(status().isForbidden());
    mvc.perform(get("/admin/users").with(as(ADMIN))).andExpect(status().isOk()).andExpect(view().name("admin/users"));
  }

  @Test
  void aFormWithoutTheCsrfTokenIsRefused() throws Exception {
    mvc.perform(post("/tasks/toggle").param("id", "1").with(as(ALICE))).andExpect(status().isForbidden());
    mvc.perform(post("/tasks/toggle").param("id", "1").with(as(ALICE)).with(csrf()))
        .andExpect(status().isSeeOther());                                // PRG: 303, not 302
  }

  @Test
  void someoneElsesTaskIsForbidden() throws Exception {
    mvc.perform(get("/tasks/view").param("id", "23").with(as(ALICE))).andExpect(status().isForbidden());
  }

  @Test
  void everyResponseCarriesTheSecurityHeaders() throws Exception {
    mvc.perform(get("/login"))
        .andExpect(header().string("Content-Security-Policy", Matchers.containsString("script-src 'self' 'nonce-")))
        .andExpect(header().string("X-Frame-Options", "DENY"))
        .andExpect(header().string("X-Content-Type-Options", "nosniff"));
  }
}
