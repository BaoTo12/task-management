package com.taskflow.controller.api;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskflow.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

/** Projects, members and roles; and the notification an invitation produces (after the commit). */
class ProjectApiControllerTest extends IntegrationTest {

  @Autowired
  ObjectMapper json;

  @Test
  void aMemberSeesTheProjectWithTheirRole() throws Exception {
    mvc.perform(get("/api/projects").with(as(CAROL)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.name == 'Website relaunch')].myRole", hasItem("MAINTAINER")));
  }

  @Test
  void aNonMemberGets404NotForbidden() throws Exception {
    mvc.perform(get("/api/projects/2").with(as(DAVE))).andExpect(status().isNotFound());   // dave isn't in "Mobile app"
  }

  @Test
  void aViewerCantRenameTheProject() throws Exception {
    mvc.perform(patch("/api/projects/1").with(as(DAVE)).with(csrf().asHeader()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Renamed\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void theCreatorBecomesOwnerAndAnInviteNotifiesTheNewMember() throws Exception {
    String created = mvc.perform(post("/api/projects").with(as(BOB)).with(csrf().asHeader())
            .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"" + unique("Project") + "\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.myRole").value("OWNER"))
        .andReturn().getResponse().getContentAsString();
    long id = json.readTree(created).get("id").asLong();

    mvc.perform(put("/api/projects/" + id + "/members/5").with(as(BOB)).with(csrf().asHeader())
            .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"MEMBER\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.role").value("MEMBER"));

    mvc.perform(get("/api/notifications?unreadOnly=true").with(as(DAVE)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].type").value("PROJECT_INVITED"))
        .andExpect(jsonPath("$.items[0].projectId").value(id));
  }

  @Test
  void anAssigneeMustBeAMemberOfTheTasksProject() throws Exception {
    mvc.perform(post("/api/tasks").with(as(ALICE)).with(csrf().asHeader()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"" + unique("Assign") + "\",\"status\":\"TODO\",\"priority\":\"LOW\",\"projectId\":1,\"assigneeId\":3}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.fieldErrors.assigneeId").exists());      // admin (3) isn't a member of project 1
  }
}
