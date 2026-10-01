package com.taskflow.repository;

import com.taskflow.entity.Notification;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** PROVIDED: the inbox. */
public interface NotificationRepository extends JpaRepository<Notification, Long> {

  /**
   * CURSOR pagination, newest first: "the next 20 older than id X". Unlike page numbers (OFFSET), it doesn't skip or
   * repeat items when new notifications arrive between two requests. A null cursor means "from the newest".
   */
  @Query("select n from Notification n where n.userId = :userId and (:before is null or n.id < :before)"
      + " and (:unreadOnly = false or n.readAt is null) order by n.id desc")
  List<Notification> inbox(@Param("userId") long userId, @Param("before") Long before,
                           @Param("unreadOnly") boolean unreadOnly, Pageable limit);

  long countByUserIdAndReadAtIsNull(long userId);

  /** Only the RECIPIENT's own notification: someone else's id simply isn't found. */
  Optional<Notification> findByIdAndUserId(long id, long userId);

  @Modifying
  @Query("update Notification n set n.readAt = :now where n.userId = :userId and n.readAt is null")
  int markAllRead(@Param("userId") long userId, @Param("now") Instant now);
}
