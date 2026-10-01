package com.taskflow.service;

import static com.taskflow.repository.criteria.TaskSpecifications.inProject;

import com.taskflow.dto.response.ReportSummaryDto;
import com.taskflow.dto.response.ReportSummaryDto.DayCount;
import com.taskflow.dto.response.ReportSummaryDto.PersonCount;
import com.taskflow.dto.response.ReportSummaryDto.PersonMinutes;
import com.taskflow.dto.response.ReportSummaryDto.ProjectCount;
import com.taskflow.dto.response.ReportSummaryDto.Totals;
import com.taskflow.entity.Priority;
import com.taskflow.entity.Task;
import com.taskflow.entity.TaskStatus;
import com.taskflow.entity.TimeEntry;
import com.taskflow.exception.FieldValidationException;
import com.taskflow.repository.TaskRepository;
import com.taskflow.repository.TimeEntryRepository;
import com.taskflow.security.AuthUser;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The reports: totals, distributions, a completions-per-day series and tracked time, over the tasks the caller may
 * see (TaskAccess.visible), optionally one project, for a date range (UTC days, at most a year).
 * The aggregation runs in JAVA with streams and Collectors.groupingBy: simple and database-independent for TaskFlow's
 * size. At a large scale it would move into SQL "group by" queries (TaskRepository.countByCategory shows that style).
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ReportService {

  public static final int MAX_DAYS = 366;

  private final TaskRepository tasks;
  private final TaskAccess access;
  private final TimeEntryRepository timeEntries;
  private final Clock clock;

  public ReportSummaryDto summary(AuthUser caller, LocalDate from, LocalDate to, Long projectId) {
    LocalDate today = LocalDate.now(clock);
    LocalDate end = to == null ? today : to;
    LocalDate start = from == null ? end.minusDays(29) : from;
    if (start.isAfter(end)) throw FieldValidationException.of("from", "must not be after 'to'");
    if (ChronoUnit.DAYS.between(start, end) >= MAX_DAYS) throw FieldValidationException.of("from", "the range is at most a year");
    Instant rangeStart = start.atStartOfDay(ZoneOffset.UTC).toInstant();
    Instant rangeEnd = end.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();     // exclusive

    List<Task> visible = tasks.findAll(access.visible(caller).and(inProject(projectId)));

    Totals totals = new Totals(
        visible.stream().filter(t -> within(t.getCreatedAt(), rangeStart, rangeEnd)).count(),
        visible.stream().filter(t -> within(t.getCompletedAt(), rangeStart, rangeEnd)).count(),
        visible.stream().filter(t -> !t.isDone()).count(),
        visible.stream().filter(t -> t.isOverdue(today)).count());

    List<TimeEntry> time = visible.isEmpty() ? List.of()
        : timeEntries.findFinished(visible.stream().map(Task::getId).toList(), rangeStart, rangeEnd);
    Instant now = clock.instant();

    return ReportSummaryDto.builder()
        .from(start).to(end).projectId(projectId)
        .totals(totals)
        .byStatus(countBy(visible, t -> t.getStatus().name(), Stream.of(TaskStatus.values()).map(Enum::name).toList()))
        .byPriority(countBy(visible, t -> t.getPriority().name(), Stream.of(Priority.values()).map(Enum::name).toList()))
        .byAssignee(visible.stream()
            .collect(Collectors.groupingBy(t -> Objects.requireNonNullElse(t.getAssigneeId(), 0L)))
            .entrySet().stream()
            .map(e -> new PersonCount(e.getKey() == 0L ? null : e.getKey(), e.getValue().size(), doneCount(e.getValue())))
            .sorted(Comparator.comparingLong(PersonCount::getTotal).reversed())
            .toList())
        .byProject(visible.stream()
            .collect(Collectors.groupingBy(t -> Objects.requireNonNullElse(t.getProjectId(), 0L)))
            .entrySet().stream()
            .map(e -> new ProjectCount(e.getKey() == 0L ? null : e.getKey(), e.getValue().size(), doneCount(e.getValue())))
            .sorted(Comparator.comparingLong(ProjectCount::getTotal).reversed())
            .toList())
        .completedPerDay(completedPerDay(visible, start, end))
        .trackedMinutes(time.stream().mapToLong(e -> e.minutes(now)).sum())
        .timeByUser(time.stream()
            .collect(Collectors.groupingBy(TimeEntry::getUserId, Collectors.summingLong(e -> e.minutes(now))))
            .entrySet().stream()
            .map(e -> new PersonMinutes(e.getKey(), e.getValue()))
            .sorted(Comparator.comparingLong(PersonMinutes::getMinutes).reversed())
            .toList())
        .build();
  }

  /** Every key present (0 included), in the given order. */
  private static Map<String, Long> countBy(List<Task> list, Function<Task, String> key, List<String> keys) {
    Map<String, Long> counted = list.stream().collect(Collectors.groupingBy(key, Collectors.counting()));
    Map<String, Long> ordered = new LinkedHashMap<>();
    keys.forEach(k -> ordered.put(k, counted.getOrDefault(k, 0L)));
    return ordered;
  }

  /** One entry per day of the range, zeros included: a chart needs every x value. */
  private static List<DayCount> completedPerDay(List<Task> list, LocalDate start, LocalDate end) {
    Map<LocalDate, Long> perDay = list.stream()
        .filter(t -> t.getCompletedAt() != null)
        .collect(Collectors.groupingBy(t -> LocalDate.ofInstant(t.getCompletedAt(), ZoneOffset.UTC), Collectors.counting()));
    return start.datesUntil(end.plusDays(1)).map(day -> new DayCount(day, perDay.getOrDefault(day, 0L))).toList();
  }

  private static long doneCount(List<Task> list) {
    return list.stream().filter(Task::isDone).count();
  }

  private static boolean within(Instant at, Instant start, Instant end) {
    return at != null && !at.isBefore(start) && at.isBefore(end);
  }
}
