package com.taskflow.web.support;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ScriptJsonTest {

  private final ScriptJson scriptJson = new ScriptJson(new ObjectMapper());

  @Test
  void aTitleCantCloseTheScriptElement() {
    String out = scriptJson.of(Map.of("title", "</script><script>alert(1)</script>"));
    assertThat(out).doesNotContain("<").doesNotContain(">").contains("\\u003c/script\\u003e");
  }

  @Test
  void theJsonStillMeansTheSame() throws Exception {
    String out = scriptJson.of(Map.of("title", "R&D <b>"));
    assertThat(new ObjectMapper().readTree(out).get("title").asText()).isEqualTo("R&D <b>");
  }
}
