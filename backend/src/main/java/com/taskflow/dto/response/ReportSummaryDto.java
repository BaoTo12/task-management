package com.taskflow.dto.response;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import lombok.Builder;
import lombok.Value;

/**
 * GET /api/reports/summary: everything the Reports screen draws, for the tasks the caller may see, in one response.
 * The JSP page /admin/reports renders the SAME object.
 *
 * Lombok @Value instead of a record, on purpose: @Value makes the class immutable (private final fields, all-args
 * constructor, equals/hashCode/toString) AND writes JavaBean getters (getTotals()). Jackson serialises either, but JSP's
 * EL (Tomcat 10.1 = EL 5.0) only understands getters: ${report.totals.open} would fail on a record.
 */
@Value
@Builder
public class ReportSummaryDto {

  LocalDate from;
  LocalDate to;
  Long projectId;
  Totals totals;
  Map<String, Long> byStatus;
  Map<String, Long> byPriority;
  List<PersonCount> byAssignee;
  List<ProjectCount> byProject;
  List<DayCount> completedPerDay;
  long trackedMinutes;
  List<PersonMinutes> timeByUser;

  /** created/completed: inside [from, to]; open/overdue: right now. */
  @Value
  public static class Totals {
    long created;
    long completed;
    long open;
    long overdue;
  }

  /** userId null = unassigned. */
  @Value
  public static class PersonCount {
    Long userId;
    long total;
    long done;
  }

  /** projectId null = personal tasks. */
  @Value
  public static class ProjectCount {
    Long projectId;
    long total;
    long done;
  }

  @Value
  public static class DayCount {
    LocalDate date;
    long count;
  }

  @Value
  public static class PersonMinutes {
    long userId;
    long minutes;
  }
}
