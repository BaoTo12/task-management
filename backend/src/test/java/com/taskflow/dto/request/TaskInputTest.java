package com.taskflow.dto.request;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskflow.entity.Priority;
import com.taskflow.entity.Task;
import java.time.LocalDate;
import java.util.Set;
import org.junit.jupiter.api.Test;

/** A plain UNIT test: no Spring, no database. TaskInput is pure logic over a JsonNode. */
class TaskInputTest {

  private final ObjectMapper json = new ObjectMapper();

  @Test
  void createRequiresTitleStatusAndPriority() throws Exception {
    TaskInput input = TaskInput.parse(json.readTree("{}"), false, Set.of(1L));
    assertThat(input.getErrors()).containsKeys("title", "status", "priority");
  }

  @Test
  void patchChecksOnlyThePresentFields() throws Exception {
    TaskInput input = TaskInput.parse(json.readTree("{\"priority\":\"HIGH\"}"), true, Set.of());
    assertThat(input.getErrors()).isEmpty();
    Task task = new Task();
    task.setTitle("unchanged");
    input.applyTo(task);
    assertThat(task.getPriority()).isEqualTo(Priority.HIGH);
    assertThat(task.getTitle()).isEqualTo("unchanged");
  }

  @Test
  void nullClearsTheDueDateButAbsenceKeepsIt() throws Exception {
    Task task = new Task();
    task.setDueDate(LocalDate.of(2026, 10, 3));
    TaskInput.parse(json.readTree("{\"title\":\"x\"}"), true, Set.of()).applyTo(task);
    assertThat(task.getDueDate()).isNotNull();
    TaskInput.parse(json.readTree("{\"dueDate\":null}"), true, Set.of()).applyTo(task);
    assertThat(task.getDueDate()).isNull();
  }

  @Test
  void unknownCategoryAndBadIdsAreFieldErrors() throws Exception {
    TaskInput input = TaskInput.parse(json.readTree("{\"categoryId\":99,\"projectId\":\"one\",\"assigneeId\":-3}"), true, Set.of(1L));
    assertThat(input.getErrors()).containsKeys("categoryId", "projectId", "assigneeId");
  }

  @Test
  void fieldsAClientMayNotSetAreIgnored() throws Exception {
    Task task = new Task();
    task.setOwnerId(2);
    TaskInput.parse(json.readTree("{\"ownerId\":1,\"id\":7}"), true, Set.of()).applyTo(task);
    assertThat(task.getOwnerId()).isEqualTo(2);
    assertThat(task.getId()).isNull();
  }
}
