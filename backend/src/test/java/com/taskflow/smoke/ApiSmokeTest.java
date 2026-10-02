package com.taskflow.smoke;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskflow.security.AuthUser;
import com.taskflow.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * SMOKE: every JSON endpoint the React app calls, the way the app calls it, must answer without a server error.
 * Not a contract test (the *ApiControllerTest classes check the details): its job is to catch the 500s that only show
 * up for ONE parameter combination, like ?sort=dueDate (Spring Data's Criteria queries reject "NULLS LAST").
 * The workflow test then walks through every WRITE endpoint once, on data it creates itself.
 */
class ApiSmokeTest extends IntegrationTest {

  @Autowired
  ObjectMapper json;

  // ── Reads ──────────────────────────────────────────────────────────────────────────────────────────────────

  @ParameterizedTest(name = "sort={0}")
  @ValueSource(strings = {
      "id,asc", "id,desc", "title,asc", "title,desc", "priority,asc", "priority,desc",
      "dueDate,asc", "dueDate,desc", "createdAt,asc", "createdAt,desc", "updatedAt,asc", "updatedAt,desc"})
  void everyTaskSortWorks(String sort) throws Exception {
    ok(get("/api/tasks").param("sort", sort).param("page", "0").param("size", "20"), ALICE);
  }

  @ParameterizedTest(name = "{0}")
  @ValueSource(strings = {
      "/api/tasks?size=100", "/api/tasks?q=report", "/api/tasks?status=DONE", "/api/tasks?status=IN_PROGRESS",
      "/api/tasks?priority=HIGH", "/api/tasks?categoryId=1", "/api/tasks?projectId=1", "/api/tasks?assigneeId=1",
      "/api/tasks?labelId=1", "/api/tasks?page=99", "/api/tasks/1", "/api/tasks/1/comments", "/api/tasks/1/subtasks",
      "/api/tasks/1/time-entries",
      "/api/stats", "/api/categories", "/api/labels", "/api/projects", "/api/projects/1", "/api/projects/1/members",
      "/api/users?q=a", "/api/users?ids=1,2", "/api/users?ids=", "/api/users",
      "/api/activity", "/api/activity?projectId=1", "/api/activity?taskId=1", "/api/activity?limit=5&before=1000000",
      "/api/notifications", "/api/notifications?unreadOnly=true", "/api/notifications?limit=5&before=1000000",
      "/api/notifications/unread-count", "/api/timer", "/api/auth/me"})
  void everyReadAnswersForAUser(String url) throws Exception {
    ok(get(url), ALICE);
  }

  @ParameterizedTest(name = "{0}")
  @ValueSource(strings = {
      "/api/reports/summary", "/api/reports/summary?from=2026-09-01&to=2026-10-31",
      "/api/reports/summary?projectId=1", "/api/tasks?sort=dueDate,desc&size=100", "/api/projects", "/api/activity"})
  void everyReadAnswersForAnAdmin(String url) throws Exception {
    ok(get(url), ADMIN);
  }

  // ── Writes: one walk through every endpoint that changes something ─────────────────────────────────────────

  @Test
  void theWholeWorkflowRunsWithoutServerErrors() throws Exception {
    // A project, with carol as a member.
    long projectId = id(ok(send(post("/api/projects"), "{\"name\":\"" + unique("Smoke project") + "\"}"), ALICE));
    ok(send(patch("/api/projects/" + projectId), "{\"description\":\"smoke\",\"color\":\"#2563eb\"}"), ALICE);
    ok(send(put("/api/projects/" + projectId + "/members/4"), "{\"role\":\"MEMBER\"}"), ALICE);
    ok(send(put("/api/projects/" + projectId + "/members/2"), "{\"role\":\"VIEWER\"}"), ALICE);

    // A task in it, assigned to carol; read, patch, replace.
    long taskId = id(ok(send(post("/api/tasks"), "{\"title\":\"" + unique("Smoke task") + "\",\"status\":\"TODO\","
        + "\"priority\":\"HIGH\",\"dueDate\":\"2026-12-01\",\"categoryId\":1,\"projectId\":" + projectId
        + ",\"assigneeId\":4}"), ALICE));
    ok(get("/api/tasks/" + taskId), ALICE);
    ok(send(patch("/api/tasks/" + taskId), "{\"status\":\"IN_PROGRESS\",\"dueDate\":null}"), ALICE);
    ok(send(put("/api/tasks/" + taskId), "{\"title\":\"" + unique("Smoke task replaced") + "\",\"status\":\"DONE\","
        + "\"priority\":\"LOW\",\"dueDate\":\"2026-11-15\",\"categoryId\":2}"), ALICE);

    // Labels.
    long labelId = id(ok(send(post("/api/labels"), "{\"name\":\"" + unique("smoke") + "\",\"color\":\"#059669\"}"), ALICE));
    ok(send(patch("/api/labels/" + labelId), "{\"color\":\"#d97706\"}"), ALICE);
    ok(send(put("/api/tasks/" + taskId + "/labels"), "{\"labelIds\":[" + labelId + "]}"), ALICE);
    ok(get("/api/tasks?labelId=" + labelId), ALICE);

    // Subtasks.
    long first = id(ok(send(post("/api/tasks/" + taskId + "/subtasks"), "{\"title\":\"one\"}"), ALICE));
    long second = id(ok(send(post("/api/tasks/" + taskId + "/subtasks"), "{\"title\":\"two\"}"), ALICE));
    ok(send(put("/api/tasks/" + taskId + "/subtasks/order"), "{\"ids\":[" + second + "," + first + "]}"), ALICE);
    ok(send(patch("/api/subtasks/" + first), "{\"done\":true,\"title\":\"one (done)\"}"), ALICE);
    ok(write(delete("/api/subtasks/" + second)), ALICE);

    // Comments.
    ok(send(post("/api/tasks/" + taskId + "/comments"), "{\"body\":\"<b>smoke</b> comment\"}"), ALICE);
    ok(get("/api/tasks/" + taskId + "/comments"), ALICE);

    // Time tracking: a manual entry, then the timer.
    long entryId = id(ok(send(post("/api/tasks/" + taskId + "/time-entries"),
        "{\"startedAt\":\"2026-09-30T08:00:00Z\",\"endedAt\":\"2026-09-30T09:30:00Z\",\"note\":\"smoke\"}"), ALICE));
    ok(write(post("/api/tasks/" + taskId + "/timer/start")), ALICE);
    ok(get("/api/timer"), ALICE);
    ok(write(post("/api/timer/stop")), ALICE);
    ok(get("/api/tasks/" + taskId + "/time-entries"), ALICE);
    ok(write(delete("/api/time-entries/" + entryId)), ALICE);

    // The feed and carol's notifications (she was invited and assigned).
    ok(get("/api/activity?taskId=" + taskId), ALICE);
    ok(get("/api/activity?projectId=" + projectId), CAROL);
    JsonNode inbox = json.readTree(ok(get("/api/notifications"), CAROL).andReturn().getResponse().getContentAsString());
    if (inbox.path("items").size() > 0) {
      ok(write(post("/api/notifications/" + inbox.path("items").get(0).path("id").asLong() + "/read")), CAROL);
    }
    ok(write(post("/api/notifications/read-all")), CAROL);
    ok(get("/api/reports/summary?projectId=" + projectId), ADMIN);

    // Clean up in reverse.
    ok(write(delete("/api/labels/" + labelId)), ALICE);
    ok(write(delete("/api/tasks/" + taskId)), ALICE);
    ok(write(delete("/api/projects/" + projectId + "/members/2")), ALICE);
    ok(write(delete("/api/projects/" + projectId)), ALICE);
  }

  // ── helpers ────────────────────────────────────────────────────────────────────────────────────────────────

  /** Performs the request as this user and expects a 2xx: anything else fails with the response body in the message. */
  private ResultActions ok(MockHttpServletRequestBuilder request, AuthUser user) throws Exception {
    return mvc.perform(request.with(as(user))).andExpect(result -> {
      int code = result.getResponse().getStatus();
      if (code < 200 || code >= 300) {
        throw new AssertionError(result.getRequest().getMethod() + " " + result.getRequest().getRequestURI() + "?"
            + result.getRequest().getQueryString() + " → " + code + ": " + result.getResponse().getContentAsString());
      }
    });
  }

  private static MockHttpServletRequestBuilder write(MockHttpServletRequestBuilder request) {
    return request.with(csrf().asHeader());
  }

  private static MockHttpServletRequestBuilder send(MockHttpServletRequestBuilder request, String body) {
    return write(request).contentType(MediaType.APPLICATION_JSON).content(body);
  }

  private long id(ResultActions result) throws Exception {
    return json.readTree(result.andReturn().getResponse().getContentAsString()).get("id").asLong();
  }
}
