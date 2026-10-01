package com.taskflow.repository;

import com.taskflow.entity.TimeEntry;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** PROVIDED: time entries. */
public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {

  List<TimeEntry> findByTaskIdOrderByStartedAtDesc(long taskId);

  /** The user's running timer, if any (ended_at IS NULL). The service keeps it to at most one. */
  Optional<TimeEntry> findFirstByUserIdAndEndedAtIsNull(long userId);

  /** Finished entries of these tasks that started in [from, to): the reports. */
  @Query("select e from TimeEntry e where e.taskId in :taskIds and e.endedAt is not null"
      + " and e.startedAt >= :from and e.startedAt < :to")
  List<TimeEntry> findFinished(@Param("taskIds") Collection<Long> taskIds, @Param("from") Instant from,
                               @Param("to") Instant to);
}
