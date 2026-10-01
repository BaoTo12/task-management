package com.taskflow.dto.response;

import com.taskflow.entity.TimeEntry;
import java.time.Instant;

/** endedAt null = running; minutes counts a running entry up to `now`. */
public record TimeEntryDto(long id, long taskId, long userId, Instant startedAt, Instant endedAt, String note,
                           long minutes) {

  public static TimeEntryDto from(TimeEntry e, Instant now) {
    return new TimeEntryDto(e.getId(), e.getTaskId(), e.getUserId(), e.getStartedAt(), e.getEndedAt(), e.getNote(),
        e.minutes(now));
  }
}
