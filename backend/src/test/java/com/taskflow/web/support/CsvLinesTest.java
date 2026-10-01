package com.taskflow.web.support;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CsvLinesTest {

  @Test
  void quotedCellsMayContainCommasAndQuotes() {
    assertThat(CsvLines.parse("\"Buy milk, eggs\",\"say \"\"hi\"\"\",HIGH,"))
        .containsExactly("Buy milk, eggs", "say \"hi\"", "HIGH", "");
  }

  @Test
  void formulasAreNeutralised() {
    assertThat(CsvLines.cell("=HYPERLINK(\"http://evil\")")).startsWith("\"'=");
    assertThat(CsvLines.cell("plain")).isEqualTo("\"plain\"");
  }
}
