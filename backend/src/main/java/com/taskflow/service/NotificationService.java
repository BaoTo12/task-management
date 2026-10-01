package com.taskflow.service;

import com.taskflow.dto.response.CursorPageDto;
import com.taskflow.dto.response.NotificationDto;
import com.taskflow.entity.Notification;
import com.taskflow.entity.NotificationType;
import com.taskflow.exception.NotFoundException;
import com.taskflow.repository.NotificationRepository;
import com.taskflow.security.AuthUser;
import java.time.Clock;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** A user's inbox: read it, mark items read, and (for NotificationDispatcher) deliver new ones. */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class NotificationService {

  public static final int MAX_LIMIT = 50;

  private final NotificationRepository notifications;
  private final NotificationStreams streams;
  private final Clock clock;

  public CursorPageDto<NotificationDto> inbox(AuthUser caller, Long before, boolean unreadOnly, int limit) {
    int size = Math.max(1, Math.min(limit, MAX_LIMIT));
    // Ask for ONE more than requested: if it exists, there is an older page, and its cursor is the last item shown.
    List<Notification> rows = notifications.inbox(caller.getId(), before, unreadOnly, PageRequest.of(0, size + 1));
    boolean more = rows.size() > size;
    List<NotificationDto> items = rows.stream().limit(size).map(NotificationDto::from).toList();
    Long nextCursor = more ? items.get(items.size() - 1).id() : null;
    return new CursorPageDto<>(items, nextCursor, unreadCount(caller));
  }

  public long unreadCount(AuthUser caller) {
    return notifications.countByUserIdAndReadAtIsNull(caller.getId());
  }

  /** Someone else's notification id is simply "not found". */
  @Transactional
  public NotificationDto markRead(long id, AuthUser caller) {
    Notification notification = notifications.findByIdAndUserId(id, caller.getId())
        .orElseThrow(() -> new NotFoundException("Notification not found"));
    notification.markRead(clock.instant());
    return NotificationDto.from(notification);
  }

  @Transactional
  public int markAllRead(AuthUser caller) {
    return notifications.markAllRead(caller.getId(), clock.instant());
  }

  /**
   * Stores a notification and pushes it to the recipient's open tabs AFTER this transaction commits: pushing before
   * would show the user something that a rollback could still undo. TransactionSynchronization is the hook for that.
   */
  @Transactional
  public void deliver(long recipientId, NotificationType type, Long actorId, Long taskId, Long projectId, String subject) {
    if (actorId != null && actorId == recipientId) return;              // nobody is notified about their own actions
    Notification saved = notifications.save(Notification.builder()
        .userId(recipientId).type(type).actorId(actorId).taskId(taskId).projectId(projectId).subject(subject)
        .build());
    NotificationDto dto = NotificationDto.from(saved);
    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
      @Override
      public void afterCommit() {
        streams.push(recipientId, dto);
      }
    });
  }
}
