package com.taskflow.controller.api;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskflow.security.AuthUser;
import com.taskflow.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

/** The tasks resource: paging, filters, validation, the owner rule, PATCH semantics. */
class TaskApiControllerTest extends IntegrationTest {

  @Autowired
  ObjectMapper json;

  @Test
  void listIsPagedWithTheContractEnvelope() throws Exception {
    mvc.perform(get("/api/tasks?page=0&size=5&sort=dueDate,asc").with(as(ALICE)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.page").value(0))
        .andExpect(jsonPath("$.size").value(5))
        .andExpect(jsonPath("$.items.length()").value(5));
  }

  @Test
  void filtersByStatus() throws Exception {
    mvc.perform(get("/api/tasks?status=DONE&size=100").with(as(ALICE)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[*].status", everyItem(is("DONE"))));
  }

  @Test
  void anInvalidSortIsAFieldError() throws Exception {
    mvc.perform(get("/api/tasks?sort=password,asc").with(as(ALICE)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.fieldErrors.sort").exists());
  }

  @Test
  void createReturns201WithLocationAndTheCallerAsOwner() throws Exception {
    String title = unique("API create");
    mvc.perform(post("/api/tasks").with(as(BOB)).with(csrf().asHeader()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"" + title + "\",\"status\":\"TODO\",\"priority\":\"HIGH\",\"ownerId\":1}"))
        .andExpect(status().isCreated())
        .andExpect(header().string("Location", startsWith("http://localhost/api/tasks/")))
        .andExpect(jsonPath("$.ownerId").value(2));                        // ownerId in the body is ignored
  }

  @Test
  void aBlankTitleIsAValidationError() throws Exception {
    mvc.perform(post("/api/tasks").with(as(BOB)).with(csrf().asHeader()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"  \",\"status\":\"TODO\",\"priority\":\"LOW\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"))
        .andExpect(jsonPath("$.fieldErrors.title").value("must not be blank"));
  }

  @Test
  void someoneElsesPrivateTaskIsNotFound() throws Exception {
    mvc.perform(get("/api/tasks/23").with(as(ALICE)))                    // "Bob: private salary review"
        .andExpect(status().isNotFound());
  }

  @Test
  void patchChangesOnlyThePresentFieldsAndNullClearsTheDate() throws Exception {
    long id = create(BOB, unique("API patch"));
    mvc.perform(patch("/api/tasks/" + id).with(as(BOB)).with(csrf().asHeader()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"status\":\"DONE\",\"dueDate\":null}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("DONE"))
        .andExpect(jsonPath("$.priority").value("HIGH"))                 // untouched
        .andExpect(jsonPath("$.dueDate").doesNotExist())
        .andExpect(jsonPath("$.completedAt").exists());                  // set by the service when it became DONE
  }

  @Test
  void aProjectViewerCanReadButNotEditAProjectTask() throws Exception {
    mvc.perform(get("/api/tasks/5").with(as(DAVE))).andExpect(status().isOk());        // dave: VIEWER of project 1
    mvc.perform(patch("/api/tasks/5").with(as(DAVE)).with(csrf().asHeader()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"hacked\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void deleteReturns204() throws Exception {
    long id = create(BOB, unique("API delete"));
    mvc.perform(delete("/api/tasks/" + id).with(as(BOB)).with(csrf().asHeader())).andExpect(status().isNoContent());
    mvc.perform(get("/api/tasks/" + id).with(as(BOB))).andExpect(status().isNotFound());
  }

  private long create(AuthUser user, String title) throws Exception {
    String body = mvc.perform(post("/api/tasks").with(as(user)).with(csrf().asHeader()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"" + title + "\",\"status\":\"TODO\",\"priority\":\"HIGH\",\"dueDate\":\"2026-12-01\"}"))
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();
    JsonNode node = json.readTree(body);
    return node.get("id").asLong();
  }
}
